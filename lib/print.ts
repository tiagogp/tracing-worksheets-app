import {
  escXML,
  decomposeTilde,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_LETTER_EXAMPLE,
  FONT_SIZE_LETTER_MODE,
  ROW_EXTRA_HEIGHT,
  TILDE_FONT_SCALE,
  LINE_COLOR,
  CELL_BORDER_COLOR,
  fitTracingFontSize,
  isTrailingBlankLine,
  getTildeTopOffset,
} from "./worksheet";
import type { Mode, WorksheetImage, WorksheetItem } from "./worksheet";

// ---------------------------------------------------------------------------
// Row HTML string builders
// ---------------------------------------------------------------------------

function buildTildeSpanStr(
  base: string,
  fontSize: number,
  color: string,
): string {
  const top = getTildeTopOffset(base);
  const tildeFontSize = Math.round(fontSize * TILDE_FONT_SCALE);
  return `<span style="position:absolute;top:${top};left:50%;transform:translateX(-50%);font-family:'Pontiletra','Patrick Hand',cursive;font-size:${tildeFontSize}px;line-height:1;color:${color}">~</span>`;
}

export function buildTracingRowStr(
  text: string,
  fontSize: number,
  dim: boolean,
  redFirstLetter = false,
  blackAndWhite = false,
  blank = false,
): string {
  const tc = dim ? "#4b5563" : "#111827";
  const fittedFontSize = fitTracingFontSize(text, fontSize);
  const rowH = fittedFontSize + ROW_EXTRA_HEIGHT;
  const cells = Array.from(text)
    .map((char, i) => {
      const color = redFirstLetter && i === 0 && !blackAndWhite ? "#dc2626" : tc;
      const { base, hasTilde } = decomposeTilde(char);
      const tilde =
        !blank && hasTilde ? buildTildeSpanStr(base, fittedFontSize, color) : "";
      const printedBase = blank ? "" : escXML(base);
      return `<div class="letter-cell"><span class="letter-char" style="position:relative;display:inline-block;font-size:${fittedFontSize}px;color:${color}">${printedBase}${tilde}</span></div>`;
    })
    .join("");
  return `<div class="tracing-row" style="height:${rowH}px">${cells}</div>`;
}

function buildLetterImageStr(image: WorksheetImage): string {
  return `<div class="letter-picture"><img src="${escXML(image.src)}" alt="${escXML(image.alt)}" /><div class="letter-picture-name">${escXML(image.label)}</div></div>`;
}

export function buildRowsStr(
  item: WorksheetItem,
  mode: Mode,
  safeLetter: string,
  lines: number,
  blackAndWhite: boolean,
): string {
  const fontSize =
    mode === "single_letter" ? FONT_SIZE_LETTER_MODE : FONT_SIZE_DEFAULT;
  const redFirstLetter = mode === "single_name";

  if (mode === "single_letter") {
    const letter = item.letter ?? item.image?.letter ?? safeLetter;
    const exampleRow = buildTracingRowStr(
      letter,
      FONT_SIZE_LETTER_EXAMPLE,
      false,
      false,
      blackAndWhite,
    );
    const heroRow = item.image
      ? `<div class="single-letter-hero">${exampleRow}${buildLetterImageStr(item.image)}</div>`
      : exampleRow;
    const tracingRows = Array.from({ length: lines }, (_, i) =>
      buildTracingRowStr(
        item.text,
        fontSize,
        true,
        false,
        blackAndWhite,
        isTrailingBlankLine(i, lines),
      ),
    ).join("");
    return heroRow + tracingRows;
  }

  const exampleRow = buildTracingRowStr(
    item.text,
    fontSize,
    false,
    redFirstLetter,
    blackAndWhite,
  );
  const practiceLineCount = Math.max(0, lines - 1);
  const tracingRows = Array.from({ length: practiceLineCount }, (_, i) =>
    buildTracingRowStr(
      item.text,
      fontSize,
      true,
      redFirstLetter,
      blackAndWhite,
      isTrailingBlankLine(i, practiceLineCount),
    ),
  ).join("");
  return exampleRow + tracingRows;
}

// ---------------------------------------------------------------------------
// Full document builder
// ---------------------------------------------------------------------------

export function buildPrintCSS(fontBase64: string): string {
  const src = fontBase64
    ? `url('data:font/truetype;base64,${fontBase64}') format('truetype')`
    : `url('/pontiletra.ttf') format('truetype')`;
  const titleColor = "#111827";
  const subtitleColor = "#4b5563";
  const headerBorderColor = "#6b7280";
  const studentBadgeColor = "#374151";
  const lineColor = LINE_COLOR;
  const cellBorderColor = CELL_BORDER_COLOR;
  const pictureNameColor = "#111827";
  const footerColor = "#6b7280";
  const imageFilter = "filter:grayscale(1) contrast(1.05);";
  return `@font-face{font-family:'Pontiletra';src:${src};font-display:block;}
@page{size:A4 portrait;margin:1.5cm;}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:100%;background:#fff;}
body{font-family:'Nunito',sans-serif;}
.ws-page{width:100%;min-height:calc(29.7cm - 3cm);display:flex;flex-direction:column;}
.ws-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid ${headerBorderColor};}
.ws-title{font-family:'Fredoka One',cursive;font-size:20px;color:${titleColor};text-transform:uppercase;letter-spacing:1px;overflow-wrap:anywhere;}
.ws-subtitle{font-size:11px;color:${subtitleColor};font-style:italic;margin-top:3px;overflow-wrap:anywhere;}
.ws-content{flex:1;}
.tracing-block{margin-bottom:10px;}
.student-badge{font-size:10px;font-weight:700;color:${studentBadgeColor};text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px;}
.tracing-row{position:relative;display:flex;border-top:1px solid ${lineColor};border-bottom:1.5px solid ${lineColor};margin-bottom:2px;}
.tracing-row::after{content:'';position:absolute;top:50%;left:0;right:0;border-top:0.7px dashed ${lineColor};pointer-events:none;}
.letter-cell{flex:1;border:2px solid ${cellBorderColor};margin-left:-2px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;position:relative;z-index:1;}
.letter-cell:first-child{margin-left:0;}
.letter-char{font-family:'Pontiletra','Patrick Hand',cursive;line-height:1;}
.single-letter-hero{display:grid;grid-template-columns:minmax(0,1fr) 132px;gap:10px;align-items:stretch;margin-bottom:2px;}
.single-letter-hero .tracing-row{margin-bottom:0;}
.letter-picture{height:168px;border:2px solid ${cellBorderColor};border-radius:8px;display:flex;flex-direction:column;align-items:stretch;justify-content:stretch;overflow:hidden;background:#fff;}
.letter-picture img{width:100%;height:136px;object-fit:contain;display:block;padding:4px;${imageFilter}}
.letter-picture-name{width:100%;border-top:1px solid ${headerBorderColor};padding:5px 4px 6px;text-align:center;font-size:14px;font-weight:800;line-height:1.1;color:${pictureNameColor};overflow-wrap:anywhere;}
.ws-footer{border-top:1px dashed #e2e8f0;margin-top:14px;padding-top:9px;display:flex;justify-content:space-between;gap:16px;font-size:11px;color:${footerColor};}
`;
}

type PrintHTMLOptions = {
  items: WorksheetItem[];
  title: string;
  subtitle: string;
  mode: Mode;
  safeLetter: string;
  lines: number;
  printCSS: string;
  blackAndWhite: boolean;
};

export function buildPrintHTML({
  items,
  title,
  subtitle,
  mode,
  safeLetter,
  lines,
  printCSS,
  blackAndWhite,
}: PrintHTMLOptions): string {
  const headerIcon = "✎";
  const pages = items
    .map((item, i) => {
      const badge = item.label
        ? `<div class="student-badge">✦ ${escXML(item.label)}</div>`
        : "";
      const pageBreak = i < items.length - 1 ? "page-break-after:always;" : "";
      return `<section class="ws-page" style="${pageBreak}">
  <div class="ws-header">
    <div>
      <div class="ws-title">${escXML(title)}</div>
      <div class="ws-subtitle">${escXML(subtitle)}</div>
    </div>
    <div aria-hidden="true" style="font-size:36px;line-height:1;color:#111827;">${headerIcon}</div>
  </div>
  <main class="ws-content">
    <div class="tracing-block">${badge}${buildRowsStr(item, mode, safeLetter, lines, blackAndWhite)}</div>
  </main>
  <div class="ws-footer">
    <span>Data: ___/___/______</span>
    <span>Nome: _______________________</span>
  </div>
</section>`;
    })
    .join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Atividade de Caligrafia</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Patrick+Hand&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
<style>${printCSS}</style></head>
<body>${pages}</body></html>`;
}

// ---------------------------------------------------------------------------
// Print orchestration
// ---------------------------------------------------------------------------

async function fetchFontAsBase64(): Promise<string> {
  const res = await fetch("/pontiletra.ttf");
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  // Array.from avoids spread-operator stack overflow on large buffers
  return btoa(
    Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join(""),
  );
}

async function fetchAsDataURL(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;

  const res = await fetch(src);
  if (!res.ok) throw new Error(`Image fetch failed: ${src}`);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

async function inlineImages(items: WorksheetItem[]): Promise<WorksheetItem[]> {
  const imageCache = new Map<string, string>();

  return Promise.all(
    items.map(async (item) => {
      if (!item.image) return item;

      try {
        const cached =
          imageCache.get(item.image.src) ?? (await fetchAsDataURL(item.image.src));
        imageCache.set(item.image.src, cached);

        return {
          ...item,
          image: {
            ...item.image,
            src: cached,
          },
        };
      } catch {
        return item;
      }
    }),
  );
}

async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          const decode = () => {
            if (image.decode) {
              void image.decode().then(
                () => resolve(),
                () => resolve(),
              );
            } else {
              resolve();
            }
          };

          if (image.complete) {
            decode();
            return;
          }

          image.addEventListener("load", decode, { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

async function waitForPrintAssets(win: Window): Promise<void> {
  const assetsReady = Promise.all([
    win.document.fonts ? win.document.fonts.ready : Promise.resolve(),
    waitForImages(win.document),
  ]);

  await Promise.race([
    assetsReady,
    new Promise<void>((resolve) => setTimeout(resolve, 1800)),
  ]);
}

export type PrintWorksheetOptions = Omit<
  PrintHTMLOptions,
  "printCSS" | "blackAndWhite"
> & {
  blackAndWhite?: boolean;
};

async function buildWorksheetDocumentHTML(
  options: PrintWorksheetOptions,
): Promise<string> {
  let fontBase64 = "";
  try {
    fontBase64 = await fetchFontAsBase64();
  } catch {
    // fall back to URL reference in @font-face
  }

  const blackAndWhite = options.blackAndWhite ?? false;
  const items = await inlineImages(options.items);
  const html = buildPrintHTML({
    ...options,
    items,
    blackAndWhite,
    printCSS: buildPrintCSS(fontBase64),
  });

  return html;
}

function shouldUsePrintableTab(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 767px)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent)
  );
}

function writePreparingDocument(win: Window) {
  win.document.open();
  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Preparando atividade</title>
<style>
html,body{height:100%;margin:0;background:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;}
body{display:grid;place-items:center;padding:24px;text-align:center;}
p{margin:0;font-size:16px;font-weight:700;}
</style>
</head><body><p>Preparando atividade...</p></body></html>`);
  win.document.close();
}

function writeDocument(win: Window, html: string) {
  win.document.open();
  win.document.write(html);
  win.document.close();
}

async function printOpenWindow(win: Window): Promise<void> {
  await waitForPrintAssets(win);

  return new Promise((resolve) => {
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(resolve, 1000);
    }, 150);
  });
}

function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function getWorksheetFilename(title: string): string {
  const slug =
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "pontiletra";

  return `${slug}.html`;
}

export async function downloadWorksheet(
  options: PrintWorksheetOptions,
): Promise<void> {
  const html = await buildWorksheetDocumentHTML(options);
  downloadHTML(html, getWorksheetFilename(options.title));
}

export async function printWorksheet(
  options: PrintWorksheetOptions,
): Promise<void> {
  const printableWindow = shouldUsePrintableTab()
    ? window.open("", "_blank")
    : null;

  if (printableWindow) {
    writePreparingDocument(printableWindow);
  }

  const html = await buildWorksheetDocumentHTML(options);

  if (printableWindow) {
    writeDocument(printableWindow, html);
    await printOpenWindow(printableWindow);
    return;
  }

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;";
  document.body.appendChild(iframe);
  iframe.src = url;

  return new Promise((resolve) => {
    iframe.addEventListener(
      "load",
      () => {
        const win = iframe.contentWindow;
        if (!win) {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
          resolve();
          return;
        }

        const finish = () => {
          win.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            resolve();
          }, 1000);
        };

        void waitForPrintAssets(win).then(
          () => setTimeout(finish, 150),
          () => setTimeout(finish, 500),
        );
      },
      { once: true },
    );
  });
}
