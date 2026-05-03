export type Mode = "single_name" | "single_letter" | "phrase" | "student_list";

export const MODE_LABELS: Record<Mode, string> = {
  single_name: "Nome Individual",
  single_letter: "Letra Individual",
  phrase: "Frase",
  student_list: "Lista de Alunos",
};

export type WorksheetItem = { text: string; label?: string };

// Design tokens — shared between preview (React) and print (HTML string)
export const FONT_SIZE_LETTER_EXAMPLE = 130; // oversized single-letter example row
export const FONT_SIZE_LETTER_MODE = 56; // tracing rows in single_letter mode
export const FONT_SIZE_DEFAULT = 68; // all other modes
export const ROW_EXTRA_HEIGHT = 38; // added to fontSize to derive row height
export const TILDE_FONT_SCALE = 0.8; // tilde accent rendered at 60% of base font size
export const LINE_COLOR = "#93c5fd";
export const CELL_BORDER_COLOR = "#60a5fa";

export function normalizeText(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export function normalizeLetter(value: string): string {
  return Array.from(value.trim().toLocaleUpperCase("pt-BR"))[0] ?? "A";
}

export function repeatedLetterLine(letter: string, repeat: number): string {
  return letter.repeat(repeat);
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
