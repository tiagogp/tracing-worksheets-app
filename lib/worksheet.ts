export type Mode = "single_name" | "single_letter" | "student_list";

export const MODE_LABELS: Record<Mode, string> = {
  single_name: "Nome Individual",
  single_letter: "Letra Individual",
  student_list: "Lista de Alunos",
};

export type WorksheetImage = {
  src: string;
  alt: string;
  letter: string;
  label: string;
};

export type WorksheetItem = {
  text: string;
  letter?: string;
  label?: string;
  image?: WorksheetImage;
};

// Design tokens — shared between preview (React) and print (HTML string)
export const FONT_SIZE_LETTER_EXAMPLE = 130; // oversized single-letter example row
export const FONT_SIZE_LETTER_MODE = 56; // tracing rows in single_letter mode
export const FONT_SIZE_DEFAULT = 68; // all other modes
export const ROW_EXTRA_HEIGHT = 38; // added to fontSize to derive row height
export const TILDE_FONT_SCALE = 0.8; // tilde accent rendered at 80% of base font size
export const TRAILING_BLANK_LINES = 3;
export const LINE_COLOR = "#9ca3af";
export const CELL_BORDER_COLOR = "#4b5563";
export const TRACING_FIT_CONTENT_WIDTH = 640;
export const TRACING_MIN_FONT_SIZE = 18;
export const TRACING_CELL_FONT_RATIO = 1.85;

export function normalizeText(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export function normalizeLetter(value: string): string {
  return Array.from(value.trim().toLocaleUpperCase("pt-BR"))[0] ?? "A";
}

export function repeatedLetterLine(letter: string, repeat: number): string {
  return letter.repeat(repeat);
}

export function shouldHighlightFirstLetter(mode: Mode): boolean {
  return mode === "single_name" || mode === "student_list";
}

export function fitTracingFontSize(
  text: string,
  requestedFontSize: number,
  availableWidth = TRACING_FIT_CONTENT_WIDTH,
): number {
  const charCount = Math.max(1, Array.from(text).length);
  const fittedSize = Math.floor(
    (availableWidth / charCount) * TRACING_CELL_FONT_RATIO,
  );

  return Math.min(
    requestedFontSize,
    Math.max(TRACING_MIN_FONT_SIZE, fittedSize),
  );
}

export function isTrailingBlankLine(index: number, totalLines: number): boolean {
  return index >= Math.max(0, totalLines - TRAILING_BLANK_LINES);
}

export function getTildeTopOffset(base: string): "-0.1em" | "-0.4em" {
  return base === base.toLocaleLowerCase("pt-BR") ? "-0.1em" : "-0.4em";
}

export function parseStudents(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function escXML(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Splits a Portuguese character into its base glyph and tilde flag (ã → {base:"a", hasTilde:true}). */
export function decomposeTilde(char: string): {
  base: string;
  hasTilde: boolean;
} {
  const COMBINING_TILDE = "̃";
  const nfd = char.normalize("NFD");
  if (nfd.includes(COMBINING_TILDE)) {
    return { base: nfd.replace(COMBINING_TILDE, ""), hasTilde: true };
  }
  return { base: char, hasTilde: false };
}
