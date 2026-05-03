"use client";

import Image from "next/image";
import { useState } from "react";
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
  normalizeText,
  normalizeLetter,
  repeatedLetterLine,
  parseStudents,
  decomposeTilde,
} from "@/lib/worksheet";
import { alphabetItems, getAlphabetItem } from "@/lib/alphabet";
import { printWorksheet } from "@/lib/print";

// ---------------------------------------------------------------------------
// Shared style primitives
// ---------------------------------------------------------------------------

const labelCls =
  "block text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.8px] mb-1.5";
const inputCls =
  "w-full px-3 py-[9px] rounded-lg border-[1.5px] border-[#e2e8f0] text-base text-slate-900 bg-slate-50 outline-none box-border";

// ---------------------------------------------------------------------------
// TracingRow — renders a single guide-lined row for the live preview.
// Replaces both the former TracingRow and TracingRowLetter components.
// ---------------------------------------------------------------------------

function TracingRow({
  text,
  fontSize,
  dim = false,
  redFirstLetter = false,
}: {
  text: string;
  fontSize: number;
  dim?: boolean;
  redFirstLetter?: boolean;
}) {
  const tc = dim ? "#c0cfe8" : "#1e293b";
  return (
    <div
      className="relative flex mb-0.5"
      style={{
        height: fontSize + ROW_EXTRA_HEIGHT,
        borderTop: `1px solid ${LINE_COLOR}`,
        borderBottom: `1.5px solid ${LINE_COLOR}`,
      }}
    >
      <div
        className="absolute top-1/2 left-0 right-0 h-0 pointer-events-none"
        style={{ borderTop: `0.7px dashed ${LINE_COLOR}` }}
      />
      {Array.from(text).map((char, i) => {
        const { base, hasTilde } = decomposeTilde(char);
        const color = redFirstLetter && i === 0 ? "#dc2626" : tc;
        return (
          <div
            key={i}
            className="flex-1 flex items-end justify-center pb-2 relative z-[1]"
            style={{
              border: `2px solid ${CELL_BORDER_COLOR}`,
              marginLeft: i === 0 ? 0 : -2,
            }}
          >
            <span
              style={{
                position: "relative",
                display: "inline-block",
                fontFamily: "var(--font-pontiletra), 'Patrick Hand', cursive",
                fontSize,
                color,
                lineHeight: 1,
              }}
            >
              {base}
              {hasTilde && (
                <span
                  style={{
                    position: "absolute",
                    top: base !== base.toLowerCase() ? "-0.4em" : "-0.4em",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily:
                      "var(--font-pontiletra), 'Patrick Hand', cursive",
                    fontSize: Math.round(fontSize * TILDE_FONT_SCALE),
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
}: {
  letter: string;
  image?: WorksheetItem["image"];
}) {
  if (!image) {
    return <TracingRow text={letter} fontSize={FONT_SIZE_LETTER_EXAMPLE} />;
  }

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_160px]">
      <TracingRow text={letter} fontSize={FONT_SIZE_LETTER_EXAMPLE} />
      <div className="flex h-42 flex-col overflow-hidden border-2 border-[#60a5fa] bg-white">
        <div className="min-h-0 flex-1 p-1">
          <Image
            src={image.src}
            alt={image.alt}
            width={160}
            height={136}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="border-t border-[#bae6fd] px-1.5 py-1.5 text-center text-sm font-extrabold leading-tight text-[#0369a1] [overflow-wrap:anywhere]">
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
  const [mode, setMode] = useState<Mode>("single_name");
  const [name, setName] = useState("Carolina");
  const [letter, setLetter] = useState("A");
  const [letterRepeat, setLetterRepeat] = useState(8);
  const [showLetterImage, setShowLetterImage] = useState(true);
  const [phrase, setPhrase] = useState("O gato subiu no telhado.");
  const [studentsText, setStudentsText] = useState(
    "Ana\nCarlos\nMariana\nJoão\nSofia",
  );
  const [lines, setLines] = useState(7);
  const [title, setTitle] = useState("Meu Nome");
  const [subtitle, setSubtitle] = useState(
    "Trace as letras pontilhadas para praticar a escrita.",
  );
  const [isPrinting, setIsPrinting] = useState(false);

  const students = parseStudents(studentsText);
  const safeLetter = normalizeLetter(letter);
  const alphabetItem = getAlphabetItem(safeLetter);
  const letterImage =
    showLetterImage && alphabetItem
      ? {
          src: alphabetItem.image,
          alt: `${alphabetItem.letter} de ${alphabetItem.label}`,
          letter: alphabetItem.letter,
          label: alphabetItem.label,
        }
      : undefined;
  const fontSize =
    mode === "single_letter" ? FONT_SIZE_LETTER_MODE : FONT_SIZE_DEFAULT;
  const isPhrase = mode === "phrase" || mode === "single_name";

  function getItems(): WorksheetItem[] {
    switch (mode) {
      case "single_name":
        return [{ text: normalizeText(name, "Nome") }];
      case "single_letter":
        return [
          {
            text: repeatedLetterLine(safeLetter, letterRepeat),
            image: letterImage,
          },
        ];
      case "phrase":
        return [{ text: normalizeText(phrase, "Frase") }];
      case "student_list":
        return students.length
          ? students.map((s) => ({ text: s, label: s }))
          : [{ text: "Aluno", label: "Aluno" }];
    }
  }

  // Computed once — shared between preview and print so they always match
  const items = getItems();

  function handleLetterChange(value: string) {
    const chars = Array.from(value.trim().toLocaleUpperCase("pt-BR"));
    setLetter(chars[chars.length - 1] ?? safeLetter);
  }

  async function handlePrint() {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      await printWorksheet({ items, title, subtitle, mode, safeLetter, lines });
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#eef2f7]"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3.5 px-4 py-4 md:px-8 shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
        style={{
          background: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)",
        }}
      >
        <span aria-hidden="true" className="text-3xl leading-none">
          ✏️
        </span>
        <div>
          <h1
            className="text-[22px] text-white tracking-[0.5px] leading-tight"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            Pontiletra
          </h1>
          <p className="text-xs text-[#bae6fd] mt-0.5">
            Gerador de folhas de caligrafia
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="px-3 py-5 sm:px-6 sm:py-7 max-w-300 mx-auto">
        <div className="flex gap-4 md:gap-6 items-start flex-wrap">
          {/* Config panel */}
          <div className="bg-white rounded-2xl px-5.5 py-6 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] flex-[1_1_292px] max-w-85 w-full">
            <p className={`${labelCls} mb-2.5`}>Tipo de Atividade</p>
            <div className="flex flex-wrap gap-1.5 mb-4.5">
              {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.25 rounded-full border-[1.5px] font-extrabold text-[11px] cursor-pointer leading-relaxed transition-colors ${
                    mode === m
                      ? "border-[#0284c7] bg-[#0284c7] text-white"
                      : "border-[#dbeafe] bg-[#f0f9ff] text-[#0369a1]"
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
                    className="h-13 w-14 rounded-lg border-[1.5px] border-[#e2e8f0] bg-slate-50 px-2 text-center text-[30px] text-slate-900 outline-none box-border"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  />
                  {alphabetItem && (
                    <div className="flex min-w-0 items-center gap-2">
                      <Image
                        src={alphabetItem.image}
                        alt={`${alphabetItem.letter} de ${alphabetItem.label}`}
                        width={44}
                        height={44}
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
                            ? "border-[#0284c7] bg-[#0284c7] text-white"
                            : "border-[#dbeafe] bg-[#f8fafc] text-[#0369a1] hover:bg-[#f0f9ff]"
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
                    className="w-full accent-[#0284c7]"
                  />
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <label
                    htmlFor="letter-image"
                    className="flex items-center gap-2 text-sm font-extrabold text-slate-700"
                  >
                    <input
                      id="letter-image"
                      type="checkbox"
                      checked={showLetterImage}
                      onChange={(e) => setShowLetterImage(e.target.checked)}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    Imagem da letra
                  </label>
                  {!alphabetItem && (
                    <div className="mt-3 text-xs font-bold text-slate-400">
                      Sem imagem para esta letra.
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === "phrase" && (
              <div className="mb-4">
                <label htmlFor="phrase-input" className={labelCls}>
                  Frase
                </label>
                <textarea
                  id="phrase-input"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  rows={3}
                  placeholder="Ex: O gato subiu no telhado."
                  className={`${inputCls} resize-y text-sm`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                />
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

            <div className="border-t border-slate-100 mt-1 mb-4" />
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
                className="w-full accent-[#0284c7]"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full py-3 rounded-[10px] border-none text-white text-base cursor-pointer tracking-[0.4px] mb-2 shadow-[0_2px_8px_rgba(2,132,199,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
                fontFamily: "'Fredoka One', cursive",
              }}
            >
              {isPrinting ? "Preparando..." : "🖨️ Imprimir"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full py-[11px] rounded-[10px] border-[1.5px] border-[#bae6fd] bg-[#f0f9ff] text-[#0284c7] text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              {isPrinting ? "Preparando..." : "📄 Salvar PDF"}
            </button>
          </div>

          {/* Preview */}
          <div className="flex-[1_1_500px] min-w-0 w-full">
            <p className={`${labelCls} mb-3`}>Pré-visualização · A4</p>

            {/* Paper */}
            <div
              className="bg-white rounded-[3px] px-5 py-6 sm:px-12 sm:py-10 shadow-[0_8px_40px_rgba(0,0,0,0.13),0_1px_4px_rgba(0,0,0,0.07)] max-w-[760px] w-full box-border"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div
                    className="text-[22px] text-[#0369a1] uppercase tracking-[1px] leading-tight [overflow-wrap:anywhere]"
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                  >
                    {title}
                  </div>
                  <div className="text-xs text-slate-500 italic mt-1 [overflow-wrap:anywhere]">
                    {subtitle}
                  </div>
                </div>
                <div aria-hidden="true" className="text-4xl leading-none ml-4">
                  ✏️
                </div>
              </div>
              <div className="border-t-2 border-[#bae6fd] mb-4" />

              {items.map((item, i) => (
                <div key={i} className="mb-3.5">
                  {item.label && (
                    <div className="text-[10px] font-extrabold text-[#0ea5e9] uppercase tracking-[0.8px] mb-1">
                      ✦ {item.label}
                    </div>
                  )}
                  {mode === "single_letter" ? (
                    <>
                      <SingleLetterHero
                        letter={safeLetter}
                        image={item.image}
                      />
                      {Array.from({ length: lines }, (_, j) => (
                        <TracingRow
                          key={j}
                          text={item.text}
                          fontSize={fontSize}
                          dim
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      <TracingRow
                        text={item.text}
                        fontSize={fontSize}
                        redFirstLetter={isPhrase}
                      />
                      {Array.from({ length: lines - 1 }, (_, j) => (
                        <TracingRow
                          key={j}
                          text={item.text}
                          fontSize={fontSize}
                          dim
                          redFirstLetter={isPhrase}
                        />
                      ))}
                    </>
                  )}
                </div>
              ))}

              <div className="border-t border-dashed border-[#e2e8f0] mt-4 pt-2.5 flex justify-between gap-4 flex-wrap text-[11px] text-slate-400">
                <span>Data: ___/___/______</span>
                <span>Nome: _______________________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
