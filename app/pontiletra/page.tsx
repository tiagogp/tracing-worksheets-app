"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Mode,
  type WorksheetItem,
  MODE_LABELS,
  LINE_COLOR,
  CELL_BORDER_COLOR,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_LETTER_EXAMPLE,
  FONT_SIZE_LETTER_MODE,
  ROW_EXTRA_HEIGHT,
  TILDE_FONT_SCALE,
  TRACING_FIT_CONTENT_WIDTH,
  normalizeText,
  normalizeLetter,
  repeatedLetterLine,
  fitTracingFontSize,
  parseStudents,
  decomposeTilde,
  isTrailingBlankLine,
  getTildeTopOffset,
} from "@/lib/worksheet";
import { alphabetItems, getAlphabetItem } from "@/lib/alphabet";
import { downloadWorksheet, printWorksheet } from "@/lib/print";
import { Image } from "@/components/custom-image";

// ---------------------------------------------------------------------------
// Shared style primitives
// ---------------------------------------------------------------------------

const labelCls =
  "block text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.8px] mb-1.5";
const inputCls =
  "w-full rounded-lg border-[1.5px] border-slate-200 bg-white px-3 py-[9px] text-base text-slate-900 outline-none box-border shadow-[inset_0_1px_0_rgba(15,23,42,0.03)] transition focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100";
const sectionDividerCls = "border-t border-slate-200 pt-4";
const toolButtonCls =
  "inline-flex h-9 items-center justify-center rounded-lg border-[1.5px] px-3 text-xs font-extrabold leading-none transition disabled:cursor-not-allowed disabled:opacity-60";

// ---------------------------------------------------------------------------
// TracingRow — renders a single guide-lined row for the live preview.
// Replaces both the former TracingRow and TracingRowLetter components.
// ---------------------------------------------------------------------------

function TracingRow({
  text,
  fontSize,
  dim = false,
  redFirstLetter = false,
  blackAndWhite = false,
  availableWidth,
  blank = false,
}: {
  text: string;
  fontSize: number;
  dim?: boolean;
  redFirstLetter?: boolean;
  blackAndWhite?: boolean;
  availableWidth?: number;
  blank?: boolean;
}) {
  const lineColor = LINE_COLOR;
  const cellBorderColor = CELL_BORDER_COLOR;
  const fittedFontSize = fitTracingFontSize(text, fontSize, availableWidth);
  const tc = dim ? "#4b5563" : "#111827";
  return (
    <div
      className="relative mb-0.5 flex"
      style={{
        height: fittedFontSize + ROW_EXTRA_HEIGHT,
        borderTop: `1px solid ${lineColor}`,
        borderBottom: `1.5px solid ${lineColor}`,
      }}
    >
      <div
        className="absolute top-1/2 left-0 right-0 h-0 pointer-events-none"
        style={{ borderTop: `0.7px dashed ${lineColor}` }}
      />
      {Array.from(text).map((char, i) => {
        const { base, hasTilde } = decomposeTilde(char);
        const color =
          redFirstLetter && i === 0 && !blackAndWhite ? "#dc2626" : tc;
        return (
          <div
            key={i}
            className="relative z-1 flex min-w-0 flex-1 items-end justify-center pb-2"
            style={{
              border: `2px solid ${cellBorderColor}`,
              marginLeft: i === 0 ? 0 : -2,
            }}
          >
            <span
              style={{
                position: "relative",
                display: "inline-block",
                fontFamily: "var(--font-pontiletra), 'Patrick Hand', cursive",
                fontSize: fittedFontSize,
                color,
                lineHeight: 1,
              }}
            >
              {blank ? "" : base}
              {!blank && hasTilde && (
                <span
                  style={{
                    position: "absolute",
                    top: getTildeTopOffset(base),
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily:
                      "var(--font-pontiletra), 'Patrick Hand', cursive",
                    fontSize: Math.round(fittedFontSize * TILDE_FONT_SCALE),
                    lineHeight: 1,
                    color,
                  }}
                >
                  ~
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SingleLetterHero({
  letter,
  image,
  blackAndWhite = false,
  availableWidth,
}: {
  letter: string;
  image?: WorksheetItem["image"];
  blackAndWhite?: boolean;
  availableWidth?: number;
}) {
  if (!image) {
    return (
      <TracingRow
        text={letter}
        fontSize={FONT_SIZE_LETTER_EXAMPLE}
        blackAndWhite={blackAndWhite}
        availableWidth={availableWidth}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_160px]">
      <TracingRow
        text={letter}
        fontSize={FONT_SIZE_LETTER_EXAMPLE}
        blackAndWhite={blackAndWhite}
        availableWidth={availableWidth}
      />
      <div
        className="flex h-42 flex-col overflow-hidden border-2 bg-white"
        style={{ borderColor: CELL_BORDER_COLOR }}
      >
        <div className="min-h-0 flex-1 p-1">
          <Image
            src={image.src}
            alt={image.alt}
            width={160}
            height={136}
            className="h-full w-full object-contain"
            style={{
              filter: "grayscale(1) contrast(1.05)",
            }}
          />
        </div>
        <div
          className="border-t px-1.5 py-1.5 text-center text-sm font-extrabold leading-tight [overflow-wrap:anywhere]"
          style={{
            borderTopColor: LINE_COLOR,
            color: "#111827",
          }}
        >
          {image.label}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PontiletraPage() {
  const paperRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("single_name");
  const [name, setName] = useState("Carolina");
  const [letter, setLetter] = useState("A");
  const [letterRepeat, setLetterRepeat] = useState(8);
  const [showLetterImage, setShowLetterImage] = useState(true);
  const [useCustomLetterImage, setUseCustomLetterImage] = useState(false);
  const [customLetterImage, setCustomLetterImage] = useState("");
  const [customLetterImageName, setCustomLetterImageName] = useState("");
  const [studentsText, setStudentsText] = useState(
    "Ana\nCarlos\nMariana\nJoão\nSofia",
  );
  const [lines, setLines] = useState(7);
  const [blackAndWhitePrint, setBlackAndWhitePrint] = useState(false);
  const [title, setTitle] = useState("Nome: ");
  const [subtitle, setSubtitle] = useState(
    "Trace as letras pontilhadas para praticar a escrita.",
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreparingAlphabet, setIsPreparingAlphabet] = useState(false);
  const [paperContentWidth, setPaperContentWidth] = useState(
    TRACING_FIT_CONTENT_WIDTH,
  );

  const students = parseStudents(studentsText);
  const safeLetter = normalizeLetter(letter);
  const alphabetItem = getAlphabetItem(safeLetter);
  const customImageLabel = normalizeText(
    customLetterImageName,
    "Imagem personalizada",
  );
  const letterImage =
    showLetterImage && useCustomLetterImage && customLetterImage
      ? {
          src: customLetterImage,
          alt: `${safeLetter} de ${customImageLabel}`,
          letter: safeLetter,
          label: customImageLabel,
        }
      : showLetterImage && !useCustomLetterImage && alphabetItem
        ? {
            src: alphabetItem.image,
            alt: `${alphabetItem.letter} de ${alphabetItem.label}`,
            letter: alphabetItem.letter,
            label: alphabetItem.label,
          }
        : undefined;
  const fontSize =
    mode === "single_letter" ? FONT_SIZE_LETTER_MODE : FONT_SIZE_DEFAULT;
  const redFirstLetter = mode === "single_name";
  const previewAccentColor = "#111827";
  const previewSoftLineColor = "#6b7280";
  const previewBadgeColor = "#374151";

  function getItems(): WorksheetItem[] {
    switch (mode) {
      case "single_name":
        return [{ text: normalizeText(name, "Nome") }];
      case "single_letter":
        return [
          {
            text: repeatedLetterLine(safeLetter, letterRepeat),
            letter: safeLetter,
            image: letterImage,
          },
        ];
      case "student_list":
        return students.length
          ? students.map((s) => ({ text: s, label: s }))
          : [{ text: "Aluno", label: "Aluno" }];
    }
  }

  // Computed once — shared between preview and print so they always match
  const items = getItems();

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const measuredPaper = paper;

    function updatePaperContentWidth() {
      const style = window.getComputedStyle(measuredPaper);
      const horizontalPadding =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);

      setPaperContentWidth(
        Math.max(180, measuredPaper.clientWidth - horizontalPadding),
      );
    }

    updatePaperContentWidth();

    const observer = new ResizeObserver(updatePaperContentWidth);
    observer.observe(measuredPaper);

    return () => observer.disconnect();
  }, []);

  function handleLetterChange(value: string) {
    const chars = Array.from(value.trim().toLocaleUpperCase("pt-BR"));
    setLetter(chars[chars.length - 1] ?? safeLetter);
  }

  function handleCustomImageChange(file: File | undefined) {
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCustomLetterImage(String(reader.result));
    });
    reader.readAsDataURL(file);

    if (!customLetterImageName.trim()) {
      setCustomLetterImageName(
        file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      );
    }
  }

  function getWorksheetOptions() {
    return {
      items,
      title,
      subtitle,
      mode,
      safeLetter,
      lines,
      blackAndWhite: blackAndWhitePrint,
    };
  }

  function getAlphabetItems(): WorksheetItem[] {
    return alphabetItems.map((item) => ({
      text: repeatedLetterLine(item.letter, letterRepeat),
      letter: item.letter,
      image: showLetterImage
        ? {
            src: item.image,
            alt: `${item.letter} de ${item.label}`,
            letter: item.letter,
            label: item.label,
          }
        : undefined,
    }));
  }

  function getAlphabetWorksheetOptions() {
    return {
      items: getAlphabetItems(),
      title: "Alfabeto",
      subtitle,
      mode: "single_letter" as const,
      safeLetter: "A",
      lines,
      blackAndWhite: blackAndWhitePrint,
    };
  }

  async function handlePrint() {
    if (isPrinting || isDownloading || isPreparingAlphabet) return;
    setIsPrinting(true);
    try {
      await printWorksheet(getWorksheetOptions());
    } finally {
      setIsPrinting(false);
    }
  }

  async function handleDownload() {
    if (isPrinting || isDownloading || isPreparingAlphabet) return;
    setIsDownloading(true);
    try {
      await downloadWorksheet(getWorksheetOptions());
    } finally {
      setIsDownloading(false);
    }
  }

  async function handlePrintAlphabet() {
    if (isPrinting || isDownloading || isPreparingAlphabet) return;
    setIsPreparingAlphabet(true);
    try {
      await printWorksheet(getAlphabetWorksheetOptions());
    } finally {
      setIsPreparingAlphabet(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#f5f7fb] text-slate-900"
      style={{
        fontFamily: "'Nunito', sans-serif",
        backgroundImage:
          "linear-gradient(90deg, rgba(15, 118, 110, 0.05) 1px, transparent 1px), linear-gradient(rgba(2, 132, 199, 0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Header */}
      <header
        className="border-b border-white/10 text-white shadow-[0_6px_24px_rgba(15,23,42,0.16)]"
        style={{
          background:
            "linear-gradient(135deg, #0f766e 0%, #0c4a6e 54%, #0f172a 100%)",
        }}
      >
        <div className="mx-auto flex max-w-[1220px] flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[27px] leading-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
            >
              ✎
            </span>
            <div className="min-w-0">
              <h1
                className="text-[24px] leading-tight tracking-[0.4px] text-white"
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                Pontiletra
              </h1>
              <p className="mt-0.5 text-sm font-bold text-sky-100">
                Gerador de folhas de caligrafia para sala de aula
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-extrabold uppercase tracking-[0.7px] text-white/90">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              A4
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              Prévia ao vivo
            </span>
            <span className="rounded-full border border-white/20 bg-amber-300 px-3 py-1.5 text-slate-900">
              Download
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-[1220px] px-4 py-5 sm:px-6 sm:py-8 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          {/* Config panel */}
          <aside className="w-full rounded-lg border border-slate-200 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_rgba(15,23,42,0.08)] sm:p-5 lg:sticky lg:top-5">
            <p className={`${labelCls} mb-2.5`}>Tipo de Atividade</p>
            <div className="mb-5 flex flex-wrap gap-1.5">
              {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={`rounded-full border-[1.5px] px-3 py-1.5 text-[11px] font-extrabold leading-relaxed transition-colors focus:outline-none focus:ring-2 focus:ring-sky-100 ${
                    mode === m
                      ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_4px_12px_rgba(15,118,110,0.22)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-[#0369a1]"
                  }`}
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {mode === "single_name" && (
              <div className="mb-4">
                <label htmlFor="student-name" className={labelCls}>
                  Nome do Aluno
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carolina"
                  className={inputCls}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                />
              </div>
            )}

            {mode === "single_letter" && (
              <div className="mb-4">
                <label htmlFor="letter-input" className={labelCls}>
                  Letra para Treinar
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="letter-input"
                    type="text"
                    value={safeLetter}
                    onChange={(e) => handleLetterChange(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    maxLength={2}
                    className="h-13 w-14 rounded-lg border-[1.5px] border-slate-200 bg-white px-2 text-center text-[30px] text-slate-900 outline-none box-border transition focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  />
                  {alphabetItem && (
                    <div className="flex min-w-0 items-center gap-2">
                      <Image
                        src={alphabetItem.image}
                        alt={`${alphabetItem.letter} de ${alphabetItem.label}`}
                        width={44}
                        height={44}
                        lazy={false}
                        className="h-11 w-11 object-contain"
                      />
                      <div className="min-w-0 text-sm font-extrabold text-slate-700">
                        {alphabetItem.label}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5">
                  {alphabetItems.map((item) => {
                    const selected = item.letter === safeLetter;

                    return (
                      <button
                        key={item.letter}
                        type="button"
                        aria-pressed={selected}
                        title={`${item.letter} de ${item.label}`}
                        onClick={() => setLetter(item.letter)}
                        className={`flex aspect-square items-center justify-center rounded-md border-[1.5px] text-sm font-extrabold transition-colors ${
                          selected
                            ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_2px_8px_rgba(15,118,110,0.2)]"
                            : "border-slate-200 bg-white text-[#0369a1] hover:border-sky-200 hover:bg-sky-50"
                        }`}
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {item.letter}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <label htmlFor="letter-repeat" className={labelCls}>
                    Repetições por linha: {letterRepeat}
                  </label>
                  <input
                    id="letter-repeat"
                    type="range"
                    min={3}
                    max={20}
                    value={letterRepeat}
                    onChange={(e) => setLetterRepeat(Number(e.target.value))}
                    className="w-full accent-[#0f766e]"
                  />
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <label
                    htmlFor="letter-image"
                    className="flex items-center gap-2 text-sm font-extrabold text-slate-700"
                  >
                    <input
                      id="letter-image"
                      type="checkbox"
                      checked={showLetterImage}
                      onChange={(e) => setShowLetterImage(e.target.checked)}
                      className="h-4 w-4 accent-[#0f766e]"
                    />
                    Imagem da letra
                  </label>
                  {showLetterImage && (
                    <>
                      <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
                        <button
                          type="button"
                          aria-pressed={!useCustomLetterImage}
                          onClick={() => setUseCustomLetterImage(false)}
                          className={`rounded-md px-2 py-2 text-xs font-extrabold transition-colors ${
                            !useCustomLetterImage
                              ? "bg-white text-[#0f766e] shadow-sm"
                              : "text-slate-500 hover:bg-white/70 hover:text-[#0369a1]"
                          }`}
                        >
                          Alfabeto
                        </button>
                        <button
                          type="button"
                          aria-pressed={useCustomLetterImage}
                          onClick={() => setUseCustomLetterImage(true)}
                          className={`rounded-md px-2 py-2 text-xs font-extrabold transition-colors ${
                            useCustomLetterImage
                              ? "bg-white text-[#0f766e] shadow-sm"
                              : "text-slate-500 hover:bg-white/70 hover:text-[#0369a1]"
                          }`}
                        >
                          Personalizada
                        </button>
                      </div>

                      {useCustomLetterImage && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label
                              htmlFor="custom-letter-name"
                              className={labelCls}
                            >
                              Nome da Imagem
                            </label>
                            <input
                              id="custom-letter-name"
                              type="text"
                              value={customLetterImageName}
                              onChange={(e) =>
                                setCustomLetterImageName(e.target.value)
                              }
                              placeholder="Ex: Avião"
                              className={`${inputCls} text-sm`}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="custom-letter-image"
                              className={labelCls}
                            >
                              Arquivo da Imagem
                            </label>
                            <input
                              id="custom-letter-image"
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleCustomImageChange(e.target.files?.[0])
                              }
                              className="block w-full cursor-pointer rounded-lg border-[1.5px] border-slate-200 bg-white text-xs font-bold text-slate-600 file:mr-3 file:border-0 file:bg-emerald-50 file:px-3 file:py-2.5 file:text-xs file:font-extrabold file:text-[#0f766e]"
                            />
                          </div>
                          {customLetterImage && (
                            <div className="flex items-center gap-3 border-t border-slate-200 pt-3">
                              <Image
                                src={customLetterImage}
                                alt={customImageLabel}
                                width={52}
                                height={52}
                                className="h-13 w-13 object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => setCustomLetterImage("")}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-extrabold text-slate-500 hover:bg-slate-50"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                          {!customLetterImage && (
                            <div className="text-xs font-bold text-slate-400">
                              Escolha uma imagem para aparecer na folha.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {!useCustomLetterImage && !alphabetItem && (
                    <div className="mt-3 text-xs font-bold text-slate-400">
                      Sem imagem para esta letra.
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === "student_list" && (
              <div className="mb-4">
                <label htmlFor="students-input" className={labelCls}>
                  Lista de Alunos (um por linha)
                </label>
                <textarea
                  id="students-input"
                  value={studentsText}
                  onChange={(e) => setStudentsText(e.target.value)}
                  rows={7}
                  placeholder={"Ana\nCarlos\nMariana"}
                  className={`${inputCls} resize-y text-sm`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                />
                <div className="text-[11px] text-slate-400 mt-1.5">
                  {students.length} aluno(s) · uma folha por aluno
                </div>
              </div>
            )}

            <div className={`${sectionDividerCls} mt-1`}>
              <p className={`${labelCls} mb-2.5`}>Configurar Folha</p>

              <div className="mb-4">
                <label htmlFor="worksheet-title" className={labelCls}>
                  Título
                </label>
                <input
                  id="worksheet-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${inputCls} text-sm`}
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="worksheet-subtitle" className={labelCls}>
                  Instrução
                </label>
                <input
                  id="worksheet-subtitle"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={`${inputCls} text-[13px]`}
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="line-count" className={labelCls}>
                  Linhas de treino: {lines}
                </label>
                <input
                  id="line-count"
                  type="range"
                  min={1}
                  max={8}
                  value={lines}
                  onChange={(e) => setLines(Number(e.target.value))}
                  className="w-full accent-[#0f766e]"
                />
              </div>

              <label
                htmlFor="black-and-white-print"
                className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-extrabold text-slate-700"
              >
                <span>Preto e branco</span>
                <input
                  id="black-and-white-print"
                  type="checkbox"
                  checked={blackAndWhitePrint}
                  onChange={(e) => setBlackAndWhitePrint(e.target.checked)}
                  className="h-4 w-4 accent-[#0f766e]"
                />
              </label>
            </div>

            <div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting || isDownloading || isPreparingAlphabet}
                className={`${toolButtonCls} h-11 border-[#0f766e] bg-[#0f766e] text-sm text-white shadow-[0_6px_16px_rgba(15,118,110,0.24)] hover:bg-[#115e59]`}
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                <span aria-hidden="true" className="mr-2 text-base">
                  ⎙
                </span>
                {isPrinting ? "Preparando..." : "Imprimir"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isPrinting || isDownloading || isPreparingAlphabet}
                className={`${toolButtonCls} h-11 border-sky-200 bg-sky-50 text-sm text-[#0369a1] hover:border-sky-300 hover:bg-white`}
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                <span
                  aria-hidden="true"
                  className="mr-2 text-base leading-none text-[#0f766e]"
                >
                  ↓
                </span>
                {isDownloading ? "Baixando..." : "Baixar"}
              </button>
              {mode === "single_letter" && (
                <button
                  type="button"
                  onClick={handlePrintAlphabet}
                  disabled={isPrinting || isDownloading || isPreparingAlphabet}
                  className={`${toolButtonCls} h-11 border-amber-200 bg-amber-50 text-sm text-slate-800 hover:border-amber-300 hover:bg-white sm:col-span-2 lg:col-span-1`}
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                >
                  <span
                    aria-hidden="true"
                    className="mr-2 text-[13px] leading-none text-[#0f766e]"
                  >
                    A-Z
                  </span>
                  {isPreparingAlphabet
                    ? "Preparando..."
                    : "Salvar alfabeto em PDF"}
                </button>
              )}
            </div>
          </aside>

          {/* Preview */}
          <section className="min-w-0 w-full">
            <div className="mb-3 flex items-end justify-between gap-3">
              <p className={labelCls}>Pré-visualização · A4</p>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.7px] ${
                  blackAndWhitePrint
                    ? "border-slate-300 bg-slate-100 text-slate-600"
                    : "border-emerald-200 bg-emerald-50 text-[#0f766e]"
                }`}
              >
                {blackAndWhitePrint ? "Preto e branco" : "Colorida"}
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#e9eff4] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_40px_rgba(15,23,42,0.10)] sm:p-4">
              {/* Paper */}
              <div
                ref={paperRef}
                className="mx-auto w-full max-w-[760px] rounded-[3px] bg-white px-5 py-6 shadow-[0_12px_32px_rgba(15,23,42,0.15),0_1px_3px_rgba(15,23,42,0.09)] box-border sm:px-12 sm:py-10"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div
                      className="text-[22px] uppercase tracking-[1px] leading-tight [overflow-wrap:anywhere]"
                      style={{
                        color: previewAccentColor,
                        fontFamily: "'Fredoka One', cursive",
                      }}
                    >
                      {title}
                    </div>
                    <div className="text-xs text-slate-500 italic mt-1 [overflow-wrap:anywhere]">
                      {subtitle}
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    className="text-4xl leading-none ml-4"
                    style={{ color: "#111827" }}
                  >
                    ✎
                  </div>
                </div>
                <div
                  className="border-t-2 mb-4"
                  style={{ borderTopColor: previewSoftLineColor }}
                />

                {items.map((item, i) => (
                  <div key={i} className="mb-3.5">
                    {item.label && (
                      <div
                        className="text-[10px] font-extrabold uppercase tracking-[0.8px] mb-1"
                        style={{ color: previewBadgeColor }}
                      >
                        ✦ {item.label}
                      </div>
                    )}
                    {mode === "single_letter" ? (
                      <>
                        <SingleLetterHero
                          letter={safeLetter}
                          image={item.image}
                          blackAndWhite={blackAndWhitePrint}
                          availableWidth={paperContentWidth}
                        />
                        {Array.from({ length: lines }, (_, j) => (
                          <TracingRow
                            key={j}
                            text={item.text}
                            fontSize={fontSize}
                            dim
                            blackAndWhite={blackAndWhitePrint}
                            availableWidth={paperContentWidth}
                            blank={isTrailingBlankLine(j, lines)}
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        <TracingRow
                          text={item.text}
                          fontSize={fontSize}
                          redFirstLetter={redFirstLetter}
                          blackAndWhite={blackAndWhitePrint}
                          availableWidth={paperContentWidth}
                        />
                        {Array.from({ length: lines - 1 }, (_, j) => (
                          <TracingRow
                            key={j}
                            text={item.text}
                            fontSize={fontSize}
                            dim
                            redFirstLetter={redFirstLetter}
                            blackAndWhite={blackAndWhitePrint}
                            availableWidth={paperContentWidth}
                            blank={isTrailingBlankLine(j, lines - 1)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                ))}

                <div
                  className="border-t border-dashed mt-4 pt-2.5 flex justify-between gap-4 flex-wrap text-[11px] text-slate-400"
                  style={{
                    borderTopColor: "#9ca3af",
                    color: "#6b7280",
                  }}
                >
                  <span>Data: ___/___/______</span>
                  <span>Nome: _______________________</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/90 px-4 py-5 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-3 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span
              className="mr-2 text-slate-800"
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              Pontiletra
            </span>
            <span>Folhas de caligrafia para alfabetização.</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400">
            <span>A4</span>
            <span>Colorido ou preto e branco</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
