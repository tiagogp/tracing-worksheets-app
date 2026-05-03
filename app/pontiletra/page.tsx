"use client";

import { useState } from "react";

type Mode = "single_name" | "single_letter" | "phrase" | "student_list";

const MODE_LABELS: Record<Mode, string> = {
  single_name: "Nome Individual",
  single_letter: "Letra Individual",
  phrase: "Frase",
  student_list: "Lista de Alunos",
};

type WorksheetItem = { text: string; label?: string };

const LETTER_BIG_FS = 130;
const LC = "#93c5fd";
const BOX_BORDER = "#60a5fa";

function normalizeText(value: string, fallback: string): string {
  return value.trim() || fallback;
}

function normalizeLetter(value: string): string {
  return Array.from(value.trim().toLocaleUpperCase("pt-BR"))[0] || "A";
}

function repeatedLetterLine(letter: string, repeat: number): string {
  return Array.from({ length: repeat }, () => letter).join("");
}

function parseStudents(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((student) => student.trim())
    .filter(Boolean);
}

function escXML(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decomposeTilde(char: string): { base: string; hasTilde: boolean } {
  const nfd = char.normalize("NFD");
  if (nfd.includes("̃")) {
    return { base: nfd.replace("̃", ""), hasTilde: true };
  }
  return { base: char, hasTilde: false };
}

function tracingRowStr(
  text: string,
  fontSize: number,
  dim: boolean,
  redFirstLetter = false,
): string {
  const tc = dim ? "#c0cfe8" : "#1e293b";
  const rowH = fontSize + 38;
  const cells = Array.from(text)
    .map((char, i) => {
      const color = redFirstLetter && i === 0 ? "#dc2626" : tc;
      const { base, hasTilde } = decomposeTilde(char);
      const tildeTop = base !== base.toLowerCase() ? "-0.4em" : "-0.1em";
      const tildeSpan = hasTilde
        ? `<span style="position:absolute;top:${tildeTop};left:50%;transform:translateX(-50%);font-family:'Pontiletra','Patrick Hand',cursive;font-size:${Math.round(fontSize * 0.6)}px;line-height:1;color:${color}">˜</span>`
        : "";
      return `<div class="letter-cell"><span class="letter-char" style="position:relative;display:inline-block;font-size:${fontSize}px;color:${color}">${escXML(base)}${tildeSpan}</span></div>`;
    })
    .join("");
  return `<div class="tracing-row" style="height:${rowH}px">${cells}</div>`;
}

function tracingRowStrLetter(letter: string): string {
  const rowH = LETTER_BIG_FS + 38;
  const { base, hasTilde } = decomposeTilde(letter);
  const tildeTop = base !== base.toLowerCase() ? "-0.4em" : "-0.1em";
  const tildeSpan = hasTilde
    ? `<span style="position:absolute;top:${tildeTop};left:50%;transform:translateX(-50%);font-family:'Pontiletra','Patrick Hand',cursive;font-size:${Math.round(LETTER_BIG_FS * 0.6)}px;line-height:1;color:#1e293b">˜</span>`
    : "";
  return `<div class="tracing-row" style="height:${rowH}px"><div class="letter-cell"><span class="letter-char" style="position:relative;display:inline-block;font-size:${LETTER_BIG_FS}px;color:#1e293b">${escXML(base)}${tildeSpan}</span></div></div>`;
}

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
  const chars = Array.from(text);
  return (
    <div
      className="relative flex mb-0.5"
      style={{
        height: fontSize + 38,
        borderTop: `1px solid ${LC}`,
        borderBottom: `1.5px solid ${LC}`,
      }}
    >
      <div
        className="absolute top-1/2 left-0 right-0 h-0 pointer-events-none"
        style={{ borderTop: `0.7px dashed ${LC}` }}
      />
      {chars.map((char, i) => {
        const { base, hasTilde } = decomposeTilde(char);
        const color = redFirstLetter && i === 0 ? "#dc2626" : tc;
        return (
          <div
            key={i}
            className="flex-1 flex items-end justify-center pb-2 relative z-[1]"
            style={{
              border: `2px solid ${BOX_BORDER}`,
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
                    top: base !== base.toLowerCase() ? "-0.4em" : "-0.1em",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily:
                      "var(--font-pontiletra), 'Patrick Hand', cursive",
                    fontSize: Math.round(fontSize),
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

function TracingRowLetter({ letter }: { letter: string }) {
  const { base, hasTilde } = decomposeTilde(letter);
  return (
    <div
      className="relative flex mb-0.5"
      style={{
        height: LETTER_BIG_FS + 38,
        borderTop: `1px solid ${LC}`,
        borderBottom: `1.5px solid ${LC}`,
      }}
    >
      <div
        className="absolute top-1/2 left-0 right-0 h-0 pointer-events-none"
        style={{ borderTop: `0.7px dashed ${LC}` }}
      />
      <div
        className="flex-1 flex items-end justify-center pb-2 relative z-1"
        style={{ border: `2px solid ${BOX_BORDER}` }}
      >
        <span
          style={{
            position: "relative",
            display: "inline-block",
            fontFamily: "var(--font-pontiletra), 'Patrick Hand', cursive",
            fontSize: LETTER_BIG_FS,
            color: "#1e293b",
            lineHeight: 1,
          }}
        >
          {base}
          {hasTilde && (
            <span
              style={{
                position: "absolute",
                top: base !== base.toLowerCase() ? "-0.4em" : "-0.1em",
                left: "50%",
                transform: "translateX(-50%)",
                fontFamily: "var(--font-pontiletra), 'Patrick Hand', cursive",
                fontSize: Math.round(LETTER_BIG_FS * 0.6),
                lineHeight: 1,
                color: "#1e293b",
              }}
            >
              ~
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function buildPrintCSS(fontBase64: string): string {
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

const labelCls =
  "block text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.8px] mb-1.5";
const inputCls =
  "w-full px-3 py-[9px] rounded-lg border-[1.5px] border-[#e2e8f0] text-base text-slate-900 bg-slate-50 outline-none box-border";

export default function PontiletraPage() {
  const [mode, setMode] = useState<Mode>("single_name");
  const [name, setName] = useState("Carolina");
  const [letter, setLetter] = useState("A");
  const [letterRepeat, setLetterRepeat] = useState(8);
  const [phrase, setPhrase] = useState("O gato subiu no telhado.");
  const [studentsText, setStudentsText] = useState(
    "Ana\nCarlos\nMariana\nJoão\nSofia",
  );
  const [lines, setLines] = useState(3);
  const [title, setTitle] = useState("Meu Nome");
  const [subtitle, setSubtitle] = useState(
    "Trace as letras pontilhadas para praticar a escrita.",
  );

  const students = parseStudents(studentsText);
  const safeLetter = normalizeLetter(letter);
  const fontSize = mode === "single_letter" ? 56 : 68;

  function getItems(): WorksheetItem[] {
    switch (mode) {
      case "single_name":
        return [{ text: normalizeText(name, "Nome") }];
      case "single_letter":
        return [{ text: repeatedLetterLine(safeLetter, letterRepeat) }];
      case "phrase":
        return [{ text: normalizeText(phrase, "Frase") }];
      case "student_list":
        return students.length
          ? students.map((s) => ({ text: s, label: s }))
          : [{ text: "Aluno", label: "Aluno" }];
      default:
        return [{ text: "" }];
    }
  }

  function buildRows(item: WorksheetItem): string {
    const isPhrase = mode === "phrase" || mode === "single_name";
    if (mode === "single_letter") {
      return [
        tracingRowStrLetter(safeLetter),
        ...Array.from({ length: lines }, () =>
          tracingRowStr(item.text, fontSize, true, isPhrase),
        ),
      ].join("");
    }
    return [
      tracingRowStr(item.text, fontSize, false, isPhrase),
      ...Array.from({ length: lines - 1 }, () =>
        tracingRowStr(item.text, fontSize, true, isPhrase),
      ),
    ].join("");
  }

  function buildPrintHTML(items: WorksheetItem[], printCSS: string): string {
    const pages = items
      .map((item, i) => {
        const badge = item.label
          ? `<div class="student-badge">✦ ${escXML(item.label)}</div>`
          : "";
        const pb = i < items.length - 1 ? "page-break-after:always;" : "";
        return `<section class="ws-page" style="${pb}">
  <div class="ws-header">
    <div>
      <div class="ws-title">${escXML(title)}</div>
      <div class="ws-subtitle">${escXML(subtitle)}</div>
    </div>
    <div aria-hidden="true" style="font-size:36px;line-height:1;">✏️</div>
  </div>
  <main class="ws-content">
    <div class="tracing-block">${badge}${buildRows(item)}</div>
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

  async function handlePrint() {
    let fontBase64 = "";
    try {
      const res = await fetch("/pontiletra.ttf");
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++)
        binary += String.fromCharCode(bytes[i]);
      fontBase64 = btoa(binary);
    } catch {
      // fall back to URL reference
    }
    const html = buildPrintHTML(getItems(), buildPrintCSS(fontBase64));
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;";
    document.body.appendChild(iframe);
    iframe.src = url;

    iframe.addEventListener(
      "load",
      () => {
        const win = iframe.contentWindow;
        if (!win) return;
        const finish = () => {
          win.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
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
  }

  const previewItems = getItems();
  const isPhrase = mode === "phrase" || mode === "single_name";

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
      <div className="px-3 py-5 sm:px-6 sm:py-7 max-w-[1200px] mx-auto">
        <div className="flex gap-4 md:gap-6 items-start flex-wrap">
          {/* Config panel */}
          <div className="bg-white rounded-2xl px-[22px] py-6 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] flex-[1_1_292px] max-w-[340px] w-full">
            <p className={`${labelCls} mb-2.5`}>Tipo de Atividade</p>
            <div className="flex flex-wrap gap-1.5 mb-[18px]">
              {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-[5px] rounded-full border-[1.5px] font-extrabold text-[11px] cursor-pointer leading-relaxed transition-colors ${
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
                <input
                  id="letter-input"
                  type="text"
                  value={letter}
                  onChange={(e) => setLetter(normalizeLetter(e.target.value))}
                  maxLength={4}
                  className="px-3 py-[9px] rounded-lg border-[1.5px] border-[#e2e8f0] text-[30px] text-center text-slate-900 bg-slate-50 outline-none box-border w-[70px]"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                />
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
                    onChange={(e) => setLetterRepeat(+e.target.value)}
                    className="w-full accent-[#0284c7]"
                  />
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
                max={6}
                value={lines}
                onChange={(e) => setLines(+e.target.value)}
                className="w-full accent-[#0284c7]"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 rounded-[10px] border-none text-white text-base cursor-pointer tracking-[0.4px] mb-2 shadow-[0_2px_8px_rgba(2,132,199,0.35)]"
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
                fontFamily: "'Fredoka One', cursive",
              }}
            >
              🖨️ Imprimir
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-[11px] rounded-[10px] border-[1.5px] border-[#bae6fd] bg-[#f0f9ff] text-[#0284c7] text-base cursor-pointer"
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              📄 Salvar PDF
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

              {previewItems.map((item, i) => (
                <div key={i} className="mb-3.5">
                  {"label" in item && item.label && (
                    <div className="text-[10px] font-extrabold text-[#0ea5e9] uppercase tracking-[0.8px] mb-1">
                      ✦ {item.label}
                    </div>
                  )}
                  {mode === "single_letter" ? (
                    <>
                      <TracingRowLetter letter={safeLetter} />
                      {/* {Array.from({ length: lines }, (_, j) => (
                        <TracingRow
                          key={j}
                          text={item.text}
                          fontSize={fontSize}
                          dim
                        />
                      ))} */}
                    </>
                  ) : (
                    <>
                      <TracingRow
                        text={item.text}
                        fontSize={fontSize}
                        redFirstLetter={isPhrase}
                      />
                      {/* {Array.from({ length: lines - 1 }, (_, j) => (
                        <TracingRow
                          key={j}
                          text={item.text}
                          fontSize={fontSize}
                          dim
                          redFirstLetter={isPhrase}
                        />
                      ))} */}
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
