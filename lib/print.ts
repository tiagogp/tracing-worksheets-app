import {
  escXML,
  decomposeTilde,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_LETTER_EXAMPLE,
  FONT_SIZE_LETTER_MODE,
  ROW_EXTRA_HEIGHT,
  TILDE_FONT_SCALE,
} from "./worksheet";
import type { Mode, WorksheetItem } from "./worksheet";

// ---------------------------------------------------------------------------
// Row HTML string builders
// ---------------------------------------------------------------------------

function buildTildeSpanStr(
  base: string,
  fontSize: number,
  color: string,
): string {
  const top = base !== base.toLowerCase() ? "-0.4em" : "-0.1em";
  const tildeFontSize = Math.round(fontSize * TILDE_FONT_SCALE);
  return `<span style="position:absolute;top:${top};left:50%;transform:translateX(-50%);font-family:'Pontiletra','Patrick Hand',cursive;font-size:${tildeFontSize}px;line-height:1;color:${color}">˜</span>`;
}

export function buildTracingRowStr(
  text: string,
  fontSize: number,
  dim: boolean,
  redFirstLetter = false,
): string {
  const tc = dim ? "#c0cfe8" : "#1e293b";
  const rowH = fontSize + ROW_EXTRA_HEIGHT;
  const cells = Array.from(text)
    .map((char, i) => {
      const color = redFirstLetter && i === 0 ? "#dc2626" : tc;
      const { base, hasTilde } = decomposeTilde(char);
      const tilde = hasTilde ? buildTildeSpanStr(base, fontSize, color) : "";
      return `<div class="letter-cell"><span class="letter-char" style="position:relative;display:inline-block;font-size:${fontSize}px;color:${color}">${escXML(base)}${tilde}</span></div>`;
    })
    .join("");
  return `<div class="tracing-row" style="height:${rowH}px">${cells}</div>`;
}

export function buildRowsStr(
  item: WorksheetItem,
  mode: Mode,
  safeLetter: string,
  lines: number,
): string {
  const fontSize =
    mode === "single_letter" ? FONT_SIZE_LETTER_MODE : FONT_SIZE_DEFAULT;
  const redFirstLetter = mode === "phrase" || mode === "single_name";

  if (mode === "single_letter") {
    const exampleRow = buildTracingRowStr(
      safeLetter,
      FONT_SIZE_LETTER_EXAMPLE,
      false,
    );
    const tracingRows = Array.from({ length: lines }, () =>
      buildTracingRowStr(item.text, fontSize, true),
    ).join("");
    return exampleRow + tracingRows;
  }

  const exampleRow = buildTracingRowStr(
    item.text,
    fontSize,
    false,
    redFirstLetter,
  );
  const tracingRows = Array.from({ length: lines - 1 }, () =>
    buildTracingRowStr(item.text, fontSize, true, redFirstLetter),
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
  return `@font-face{font-family:'Pontiletra';src:${src};font-display:block;}
@page{size:A4 portrait;margin:1.5cm;}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:100%;background:#fff;}
body{font-family:'Nunito',sans-serif;}
.ws-page{width:100%;min-height:calc(29.7cm - 3cm);display:flex;flex-direction:column;}
.ws-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid #bae6fd;}
.ws-title{font-family:'Fredoka One',cursive;font-size:20px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;overflow-wrap:anywhere;}
.ws-subtitle{font-size:11px;color:#64748b;font-style:italic;margin-top:3px;overflow-wrap:anywhere;}
.ws-content{flex:1;}
.tracing-block{margin-bottom:10px;}
.student-badge{font-size:10px;font-weight:700;color:#0ea5e9;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px;}
.tracing-row{position:relative;display:flex;border-top:1px solid #93c5fd;border-bottom:1.5px solid #93c5fd;margin-bottom:2px;}
.tracing-row::after{content:'';position:absolute;top:50%;left:0;right:0;border-top:0.7px dashed #93c5fd;pointer-events:none;}
.letter-cell{flex:1;border:2px solid #60a5fa;margin-left:-2px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;position:relative;z-index:1;}
.letter-cell:first-child{margin-left:0;}
.letter-char{font-family:'Pontiletra','Patrick Hand',cursive;line-height:1;}
.ws-footer{border-top:1px dashed #e2e8f0;margin-top:14px;padding-top:9px;display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#94a3b8;}
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
};

export function buildPrintHTML({
  items,
  title,
  subtitle,
  mode,
  safeLetter,
  lines,
  printCSS,
}: PrintHTMLOptions): string {
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
    <div aria-hidden="true" style="font-size:36px;line-height:1;">✏️</div>
  </div>
  <main class="ws-content">
    <div class="tracing-block">${badge}${buildRowsStr(item, mode, safeLetter, lines)}</div>
  </main>
  <div class="ws-footer">
    <span>Data: ___/___/______</span>
    <span>Nome: _______________________</span>
  </div>
</section>`;
    })
    .join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
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

export type PrintWorksheetOptions = Omit<PrintHTMLOptions, "printCSS">;

export async function printWorksheet(
  options: PrintWorksheetOptions,
): Promise<void> {
  let fontBase64 = "";
  try {
    fontBase64 = await fetchFontAsBase64();
  } catch {
    // fall back to URL reference in @font-face
  }

  const html = buildPrintHTML({
    ...options,
    printCSS: buildPrintCSS(fontBase64),
  });
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

        if (win.document.fonts) {
          void win.document.fonts.ready.then(
            () => setTimeout(finish, 150),
            () => setTimeout(finish, 500),
          );
        } else {
          setTimeout(finish, 800);
        }
      },
      { once: true },
    );
  });
}
