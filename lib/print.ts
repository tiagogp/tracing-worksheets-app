import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";
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
  shouldHighlightFirstLetter,
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
  const redFirstLetter = shouldHighlightFirstLetter(mode);

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

// ---------------------------------------------------------------------------
// PDF download orchestration
// ---------------------------------------------------------------------------

const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const CSS_PX_TO_PT = 0.75;
const PDF_MARGIN = (1.5 * 72) / 2.54;
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN * 2;

type WorksheetPdfFonts = {
  tracing: PDFFont;
  regular: PDFFont;
  bold: PDFFont;
};

type DrawTextOptions = {
  x: number;
  y: number;
  maxWidth: number;
  font: PDFFont;
  fontSize: number;
  color: RGB;
  minFontSize?: number;
};

function px(value: number): number {
  return value * CSS_PX_TO_PT;
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  );
}

function sanitizePdfText(text: string): string {
  return text.replace(/[^\x20-\x7e\xa0-\xff]/g, "");
}

function fitTextSize(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  minFontSize = 6,
): number {
  let size = fontSize;
  while (size > minFontSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawFittedText(page: PDFPage, text: string, options: DrawTextOptions) {
  const safeText = sanitizePdfText(text);
  if (!safeText) return;

  const size = fitTextSize(
    safeText,
    options.font,
    options.fontSize,
    options.maxWidth,
    options.minFontSize,
  );

  page.drawText(safeText, {
    x: options.x,
    y: options.y,
    size,
    font: options.font,
    color: options.color,
  });
}

function drawCenteredFittedText(
  page: PDFPage,
  text: string,
  options: DrawTextOptions,
) {
  const safeText = sanitizePdfText(text);
  if (!safeText) return;

  const size = fitTextSize(
    safeText,
    options.font,
    options.fontSize,
    options.maxWidth,
    options.minFontSize,
  );
  const textWidth = options.font.widthOfTextAtSize(safeText, size);

  page.drawText(safeText, {
    x: options.x + Math.max(0, options.maxWidth - textWidth) / 2,
    y: options.y,
    size,
    font: options.font,
    color: options.color,
  });
}

function drawPdfHeader(
  page: PDFPage,
  fonts: WorksheetPdfFonts,
  title: string,
  subtitle: string,
): number {
  const textColor = rgb(17 / 255, 24 / 255, 39 / 255);
  const subtitleColor = rgb(75 / 255, 85 / 255, 99 / 255);
  const borderColor = rgb(107 / 255, 114 / 255, 128 / 255);
  const topY = PDF_PAGE_HEIGHT - PDF_MARGIN;
  const rightIconWidth = px(42);

  drawFittedText(page, title.toLocaleUpperCase("pt-BR"), {
    x: PDF_MARGIN,
    y: topY - px(22),
    maxWidth: PDF_CONTENT_WIDTH - rightIconWidth,
    font: fonts.bold,
    fontSize: px(20),
    color: textColor,
    minFontSize: px(11),
  });

  drawFittedText(page, subtitle, {
    x: PDF_MARGIN,
    y: topY - px(37),
    maxWidth: PDF_CONTENT_WIDTH - rightIconWidth,
    font: fonts.regular,
    fontSize: px(11),
    color: subtitleColor,
    minFontSize: px(8),
  });

  page.drawText("P", {
    x: PDF_PAGE_WIDTH - PDF_MARGIN - px(26),
    y: topY - px(33),
    size: px(30),
    font: fonts.bold,
    color: textColor,
  });

  const borderY = topY - px(50);
  page.drawLine({
    start: { x: PDF_MARGIN, y: borderY },
    end: { x: PDF_PAGE_WIDTH - PDF_MARGIN, y: borderY },
    thickness: px(2),
    color: borderColor,
  });

  return borderY - px(14);
}

function drawPdfFooter(page: PDFPage, fonts: WorksheetPdfFonts) {
  const footerColor = rgb(107 / 255, 114 / 255, 128 / 255);
  const borderY = PDF_MARGIN + px(30);

  page.drawLine({
    start: { x: PDF_MARGIN, y: borderY },
    end: { x: PDF_PAGE_WIDTH - PDF_MARGIN, y: borderY },
    thickness: px(1),
    color: rgb(226 / 255, 232 / 255, 240 / 255),
    dashArray: [px(4), px(3)],
  });

  page.drawText("Data: ___/___/______", {
    x: PDF_MARGIN,
    y: PDF_MARGIN + px(12),
    size: px(11),
    font: fonts.regular,
    color: footerColor,
  });

  const nameText = "Nome: _______________________";
  const nameSize = px(11);
  const nameWidth = fonts.regular.widthOfTextAtSize(nameText, nameSize);
  page.drawText(nameText, {
    x: PDF_PAGE_WIDTH - PDF_MARGIN - nameWidth,
    y: PDF_MARGIN + px(12),
    size: nameSize,
    font: fonts.regular,
    color: footerColor,
  });
}

function drawPdfBadge(
  page: PDFPage,
  fonts: WorksheetPdfFonts,
  label: string | undefined,
  cursorY: number,
): number {
  if (!label) return cursorY;

  drawFittedText(page, label.toLocaleUpperCase("pt-BR"), {
    x: PDF_MARGIN,
    y: cursorY - px(10),
    maxWidth: PDF_CONTENT_WIDTH,
    font: fonts.bold,
    fontSize: px(10),
    color: rgb(55 / 255, 65 / 255, 81 / 255),
    minFontSize: px(8),
  });

  return cursorY - px(15);
}

function drawPdfTracingChar({
  page,
  font,
  char,
  x,
  y,
  width,
  fontSize,
  color,
}: {
  page: PDFPage;
  font: PDFFont;
  char: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  color: RGB;
}) {
  const { base, hasTilde } = decomposeTilde(char);
  if (!base.trim()) return;

  const baseWidth = font.widthOfTextAtSize(base, fontSize);
  const baselineY = y + px(8);
  page.drawText(base, {
    x: x + (width - baseWidth) / 2,
    y: baselineY,
    size: fontSize,
    font,
    color,
  });

  if (!hasTilde) return;

  const tildeSize = fontSize * TILDE_FONT_SCALE;
  const tildeWidth = font.widthOfTextAtSize("~", tildeSize);
  const tildeY =
    baselineY +
    fontSize * (base === base.toLocaleLowerCase("pt-BR") ? 0.58 : 0.86);

  page.drawText("~", {
    x: x + (width - tildeWidth) / 2,
    y: tildeY,
    size: tildeSize,
    font,
    color,
  });
}

function drawPdfTracingRow({
  page,
  fonts,
  text,
  fontSizePx,
  dim,
  redFirstLetter,
  blackAndWhite,
  blank,
  x,
  y,
  width,
}: {
  page: PDFPage;
  fonts: WorksheetPdfFonts;
  text: string;
  fontSizePx: number;
  dim: boolean;
  redFirstLetter: boolean;
  blackAndWhite: boolean;
  blank: boolean;
  x: number;
  y: number;
  width: number;
}): number {
  const chars = Array.from(text);
  const charCount = Math.max(1, chars.length);
  const fittedFontSizePx = fitTracingFontSize(text, fontSizePx);
  const fontSize = px(fittedFontSizePx);
  const rowHeight = px(fittedFontSizePx + ROW_EXTRA_HEIGHT);
  const rowBottom = y - rowHeight;
  const cellWidth = width / charCount;
  const lineColor = hexToRgb(LINE_COLOR);
  const cellBorderColor = hexToRgb(CELL_BORDER_COLOR);
  const textColor = dim
    ? rgb(75 / 255, 85 / 255, 99 / 255)
    : rgb(17 / 255, 24 / 255, 39 / 255);

  for (let i = 0; i < charCount; i += 1) {
    page.drawRectangle({
      x: x + i * cellWidth,
      y: rowBottom,
      width: cellWidth,
      height: rowHeight,
      borderWidth: px(2),
      borderColor: cellBorderColor,
    });
  }

  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: px(1),
    color: lineColor,
  });
  page.drawLine({
    start: { x, y: rowBottom },
    end: { x: x + width, y: rowBottom },
    thickness: px(1.5),
    color: lineColor,
  });
  page.drawLine({
    start: { x, y: rowBottom + rowHeight / 2 },
    end: { x: x + width, y: rowBottom + rowHeight / 2 },
    thickness: px(0.7),
    color: lineColor,
    dashArray: [px(4), px(4)],
  });

  if (!blank) {
    chars.forEach((char, i) => {
      const color =
        redFirstLetter && i === 0 && !blackAndWhite
          ? rgb(220 / 255, 38 / 255, 38 / 255)
          : textColor;

      drawPdfTracingChar({
        page,
        font: fonts.tracing,
        char,
        x: x + i * cellWidth,
        y: rowBottom,
        width: cellWidth,
        fontSize,
        color,
      });
    });
  }

  return rowBottom - px(2);
}

function drawPdfLetterImage(
  page: PDFPage,
  fonts: WorksheetPdfFonts,
  image: WorksheetImage,
  pdfImage: PDFImage | null | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const borderColor = hexToRgb(CELL_BORDER_COLOR);
  const labelBorderColor = rgb(107 / 255, 114 / 255, 128 / 255);
  const labelHeight = px(32);
  const padding = px(4);

  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderWidth: px(2),
    borderColor,
  });

  page.drawLine({
    start: { x, y: y + labelHeight },
    end: { x: x + width, y: y + labelHeight },
    thickness: px(1),
    color: labelBorderColor,
  });

  if (pdfImage) {
    const imageAreaX = x + padding;
    const imageAreaY = y + labelHeight + padding;
    const imageAreaWidth = width - padding * 2;
    const imageAreaHeight = height - labelHeight - padding * 2;
    const scale = Math.min(
      imageAreaWidth / pdfImage.width,
      imageAreaHeight / pdfImage.height,
    );
    const drawWidth = pdfImage.width * scale;
    const drawHeight = pdfImage.height * scale;

    page.drawImage(pdfImage, {
      x: imageAreaX + (imageAreaWidth - drawWidth) / 2,
      y: imageAreaY + (imageAreaHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  drawCenteredFittedText(page, image.label, {
    x: x + px(4),
    y: y + px(8),
    maxWidth: width - px(8),
    font: fonts.bold,
    fontSize: px(14),
    color: rgb(17 / 255, 24 / 255, 39 / 255),
    minFontSize: px(8),
  });
}

function drawPdfSingleLetterHero({
  page,
  fonts,
  item,
  safeLetter,
  blackAndWhite,
  pdfImage,
  cursorY,
}: {
  page: PDFPage;
  fonts: WorksheetPdfFonts;
  item: WorksheetItem;
  safeLetter: string;
  blackAndWhite: boolean;
  pdfImage: PDFImage | null | undefined;
  cursorY: number;
}): number {
  const letter = item.letter ?? item.image?.letter ?? safeLetter;
  const rowHeight = px(
    fitTracingFontSize(letter, FONT_SIZE_LETTER_EXAMPLE) + ROW_EXTRA_HEIGHT,
  );

  if (!item.image) {
    return drawPdfTracingRow({
      page,
      fonts,
      text: letter,
      fontSizePx: FONT_SIZE_LETTER_EXAMPLE,
      dim: false,
      redFirstLetter: false,
      blackAndWhite,
      blank: false,
      x: PDF_MARGIN,
      y: cursorY,
      width: PDF_CONTENT_WIDTH,
    });
  }

  const imageWidth = px(132);
  const imageHeight = px(168);
  const gap = px(10);
  const heroHeight = Math.max(rowHeight, imageHeight);
  const imageX = PDF_PAGE_WIDTH - PDF_MARGIN - imageWidth;
  const rowWidth = PDF_CONTENT_WIDTH - imageWidth - gap;
  const heroBottom = cursorY - heroHeight;

  drawPdfTracingRow({
    page,
    fonts,
    text: letter,
    fontSizePx: FONT_SIZE_LETTER_EXAMPLE,
    dim: false,
    redFirstLetter: false,
    blackAndWhite,
    blank: false,
    x: PDF_MARGIN,
    y: cursorY,
    width: rowWidth,
  });

  drawPdfLetterImage(
    page,
    fonts,
    item.image,
    pdfImage,
    imageX,
    cursorY - imageHeight,
    imageWidth,
    imageHeight,
  );

  return heroBottom - px(2);
}

function drawPdfRows({
  page,
  fonts,
  item,
  mode,
  safeLetter,
  lines,
  blackAndWhite,
  pdfImage,
  cursorY,
}: {
  page: PDFPage;
  fonts: WorksheetPdfFonts;
  item: WorksheetItem;
  mode: Mode;
  safeLetter: string;
  lines: number;
  blackAndWhite: boolean;
  pdfImage: PDFImage | null | undefined;
  cursorY: number;
}) {
  if (mode === "single_letter") {
    let nextY = drawPdfSingleLetterHero({
      page,
      fonts,
      item,
      safeLetter,
      blackAndWhite,
      pdfImage,
      cursorY,
    });

    for (let i = 0; i < lines; i += 1) {
      nextY = drawPdfTracingRow({
        page,
        fonts,
        text: item.text,
        fontSizePx: FONT_SIZE_LETTER_MODE,
        dim: true,
        redFirstLetter: false,
        blackAndWhite,
        blank: isTrailingBlankLine(i, lines),
        x: PDF_MARGIN,
        y: nextY,
        width: PDF_CONTENT_WIDTH,
      });
    }
    return;
  }

  const redFirstLetter = shouldHighlightFirstLetter(mode);
  let nextY = drawPdfTracingRow({
    page,
    fonts,
    text: item.text,
    fontSizePx: FONT_SIZE_DEFAULT,
    dim: false,
    redFirstLetter,
    blackAndWhite,
    blank: false,
    x: PDF_MARGIN,
    y: cursorY,
    width: PDF_CONTENT_WIDTH,
  });
  const practiceLineCount = Math.max(0, lines - 1);

  for (let i = 0; i < practiceLineCount; i += 1) {
    nextY = drawPdfTracingRow({
      page,
      fonts,
      text: item.text,
      fontSizePx: FONT_SIZE_DEFAULT,
      dim: true,
      redFirstLetter,
      blackAndWhite,
      blank: isTrailingBlankLine(i, practiceLineCount),
      x: PDF_MARGIN,
      y: nextY,
      width: PDF_CONTENT_WIDTH,
    });
  }
}

async function fetchFontBytes(): Promise<ArrayBuffer> {
  const res = await fetch("/pontiletra.ttf");
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    if (!src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(`Image load failed: ${src}`)),
      { once: true },
    );
    image.src = src;
  });
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas export failed"));
        return;
      }

      void blob.arrayBuffer().then(
        (buffer) => resolve(new Uint8Array(buffer)),
        reject,
      );
    }, "image/png");
  });
}

async function imageSourceToGrayscalePngBytes(src: string): Promise<Uint8Array> {
  const image = await loadImage(src);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) throw new Error(`Invalid image size: ${src}`);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < data.data.length; i += 4) {
    const gray =
      data.data[i] * 0.299 + data.data[i + 1] * 0.587 + data.data[i + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.05 + 128));
    data.data[i] = contrasted;
    data.data[i + 1] = contrasted;
    data.data[i + 2] = contrasted;
  }
  ctx.putImageData(data, 0, 0);

  return canvasToPngBytes(canvas);
}

async function buildPdfImageCache(
  pdfDoc: PDFDocument,
  items: WorksheetItem[],
): Promise<Map<string, PDFImage | null>> {
  const imageCache = new Map<string, PDFImage | null>();
  const uniqueImages = Array.from(
    new Set(items.map((item) => item.image?.src).filter(Boolean)),
  ) as string[];

  await Promise.all(
    uniqueImages.map(async (src) => {
      try {
        const imageBytes = await imageSourceToGrayscalePngBytes(src);
        imageCache.set(src, await pdfDoc.embedPng(imageBytes));
      } catch {
        imageCache.set(src, null);
      }
    }),
  );

  return imageCache;
}

async function buildWorksheetPDF(
  options: PrintWorksheetOptions,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await fetchFontBytes();
  const fonts: WorksheetPdfFonts = {
    tracing: await pdfDoc.embedFont(fontBytes, { subset: true }),
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const imageCache = await buildPdfImageCache(pdfDoc, options.items);
  const blackAndWhite = options.blackAndWhite ?? false;

  options.items.forEach((item) => {
    const page = pdfDoc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
    const contentY = drawPdfHeader(page, fonts, options.title, options.subtitle);
    const rowsY = drawPdfBadge(page, fonts, item.label, contentY);
    const pdfImage = item.image ? imageCache.get(item.image.src) : undefined;

    drawPdfRows({
      page,
      fonts,
      item,
      mode: options.mode,
      safeLetter: options.safeLetter,
      lines: options.lines,
      blackAndWhite,
      pdfImage,
      cursorY: rowsY,
    });
    drawPdfFooter(page, fonts);
  });

  return pdfDoc.save();
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

function downloadBlob(blob: Blob, filename: string) {
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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function getWorksheetFilename(title: string, extension: "html" | "pdf"): string {
  const slug =
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "pontiletra";

  return `${slug}.${extension}`;
}

export async function downloadWorksheet(
  options: PrintWorksheetOptions,
): Promise<void> {
  const pdfBytes = await buildWorksheetPDF(options);
  downloadBlob(
    new Blob([toArrayBuffer(pdfBytes)], { type: "application/pdf" }),
    getWorksheetFilename(options.title, "pdf"),
  );
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
