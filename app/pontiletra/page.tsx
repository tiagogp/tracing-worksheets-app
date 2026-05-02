'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

type Mode = 'single_name' | 'single_letter' | 'phrase' | 'student_list';

const MODE_LABELS: Record<Mode, string> = {
  single_name: 'Nome Individual',
  single_letter: 'Letra Individual',
  phrase: 'Frase',
  student_list: 'Lista de Alunos',
};

const lbl: CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: 6,
};

const fld: CSSProperties = { marginBottom: 16 };

const inp: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid #e2e8f0',
  fontFamily: "'Patrick Hand', cursive",
  fontSize: 16,
  color: '#0f172a',
  background: '#f8fafc',
  outline: 'none',
  boxSizing: 'border-box',
};

// A4 printable width at 96 dpi with 1.5 cm margins ≈ 680 px
const SVG_W = 680;

function escXML(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tracingSVGStr(text: string, fontSize: number, dotted: boolean, letterBox = false): string {
  const h = fontSize + 38;
  const lc = '#93c5fd';
  const tc = dotted ? '#c0cfe8' : '#1e293b';
  const textAttrs = dotted
    ? `fill="none" stroke="${tc}" stroke-width="2.5" stroke-dasharray="3 5" stroke-linecap="round"`
    : `fill="${tc}"`;
  const boxW = (SVG_W - 32) / text.length;
  const boxes = letterBox
    ? Array.from({ length: text.length }, (_, i) =>
        `<rect x="${16 + i * boxW}" y="6" width="${boxW}" height="${h - 14}" fill="none" stroke="#bfdbfe" stroke-width="0.8"/>`
      ).join('')
    : '';
  return `<svg class="tracing-svg" viewBox="0 0 ${SVG_W} ${h}" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="${h - 8}" x2="${SVG_W - 10}" y2="${h - 8}" stroke="${lc}" stroke-width="1.5"/>
  <line x1="10" y1="${h / 2 - 2}" x2="${SVG_W - 10}" y2="${h / 2 - 2}" stroke="${lc}" stroke-width="0.7" stroke-dasharray="4 4"/>
  <line x1="10" y1="6" x2="${SVG_W - 10}" y2="6" stroke="${lc}" stroke-width="1"/>
  ${boxes}<text x="16" y="${fontSize + 2}" font-family="'Patrick Hand', cursive" font-size="${fontSize}" ${textAttrs}>${escXML(text)}</text>
</svg>`;
}

function TracingRow({ text, fontSize, dotted, letterBox = false }: { text: string; fontSize: number; dotted: boolean; letterBox?: boolean }) {
  const h = fontSize + 38;
  const lc = '#93c5fd';
  const tc = dotted ? '#c0cfe8' : '#1e293b';
  const boxW = (SVG_W - 32) / text.length;
  return (
    <svg
      style={{ width: '100%', display: 'block', overflow: 'visible' }}
      viewBox={`0 0 ${SVG_W} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="10" y1={h - 8} x2={SVG_W - 10} y2={h - 8} stroke={lc} strokeWidth="1.5" />
      <line x1="10" y1={h / 2 - 2} x2={SVG_W - 10} y2={h / 2 - 2} stroke={lc} strokeWidth="0.7" strokeDasharray="4 4" />
      <line x1="10" y1="6" x2={SVG_W - 10} y2="6" stroke={lc} strokeWidth="1" />
      {letterBox && Array.from({ length: text.length }, (_, i) => (
        <rect key={i} x={16 + i * boxW} y={6} width={boxW} height={h - 14} fill="none" stroke="#bfdbfe" strokeWidth="0.8" />
      ))}
      {dotted ? (
        <text x="16" y={fontSize + 2} fontFamily="var(--font-pontiletra), 'Patrick Hand', cursive" fontSize={fontSize}
          fill="none" stroke={tc} strokeWidth="2.5" strokeDasharray="3 5" strokeLinecap="round">
          {text}
        </text>
      ) : (
        <text x="16" y={fontSize + 2} fontFamily="var(--font-pontiletra), 'Patrick Hand', cursive" fontSize={fontSize} fill={tc}>
          {text}
        </text>
      )}
    </svg>
  );
}

const LETTER_BIG_FS = 130;

function tracingSVGStrLetter(letter: string): string {
  const fs = LETTER_BIG_FS;
  const h = fs + 38;
  const lc = '#93c5fd';
  return `<svg class="tracing-svg" viewBox="0 0 ${SVG_W} ${h}" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="${h - 8}" x2="${SVG_W - 10}" y2="${h - 8}" stroke="${lc}" stroke-width="1.5"/>
  <line x1="10" y1="${h / 2 - 2}" x2="${SVG_W - 10}" y2="${h / 2 - 2}" stroke="${lc}" stroke-width="0.7" stroke-dasharray="4 4"/>
  <line x1="10" y1="6" x2="${SVG_W - 10}" y2="6" stroke="${lc}" stroke-width="1"/>
  <text x="${SVG_W / 2}" y="${fs + 2}" text-anchor="middle" font-family="'Patrick Hand', cursive" font-size="${fs}" fill="#1e293b">${escXML(letter)}</text>
</svg>`;
}

function TracingRowLetter({ letter }: { letter: string }) {
  const fs = LETTER_BIG_FS;
  const h = fs + 38;
  const lc = '#93c5fd';
  return (
    <svg
      style={{ width: '100%', display: 'block', overflow: 'visible' }}
      viewBox={`0 0 ${SVG_W} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="10" y1={h - 8} x2={SVG_W - 10} y2={h - 8} stroke={lc} strokeWidth="1.5" />
      <line x1="10" y1={h / 2 - 2} x2={SVG_W - 10} y2={h / 2 - 2} stroke={lc} strokeWidth="0.7" strokeDasharray="4 4" />
      <line x1="10" y1="6" x2={SVG_W - 10} y2="6" stroke={lc} strokeWidth="1" />
      <text x={SVG_W / 2} y={fs + 2} textAnchor="middle" fontFamily="var(--font-pontiletra), 'Patrick Hand', cursive" fontSize={fs} fill="#1e293b">
        {letter}
      </text>
    </svg>
  );
}

const PRINT_CSS = `
@page{size:A4 portrait;margin:1.5cm;}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:100%;background:#fff;}
body{font-family:'Nunito',sans-serif;}
.ws{width:100%;}
.ws-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid #bae6fd;}
.ws-title{font-family:'Fredoka One',cursive;font-size:20px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;}
.ws-subtitle{font-size:11px;color:#64748b;font-style:italic;margin-top:3px;}
.tracing-block{margin-bottom:10px;}
.student-badge{font-size:10px;font-weight:700;color:#0ea5e9;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px;}
svg.tracing-svg{width:100%;display:block;}
.ws-footer{border-top:1px dashed #e2e8f0;margin-top:14px;padding-top:9px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;}
`;

export default function PontiletraPage() {
  const [mode, setMode] = useState<Mode>('single_name');
  const [name, setName] = useState('Carolina');
  const [letter, setLetter] = useState('A');
  const [letterRepeat, setLetterRepeat] = useState(8);
  const [phrase, setPhrase] = useState('O gato subiu no telhado.');
  const [studentsText, setStudentsText] = useState('Ana\nCarlos\nMariana\nJoão\nSofia');
  const [lines, setLines] = useState(3);
  const [showLetterBox, setShowLetterBox] = useState(false);
  const [title, setTitle] = useState('Meu Nome');
  const [subtitle, setSubtitle] = useState('Trace as letras pontilhadas para praticar a escrita.');

  const students = studentsText.split('\n').filter((s) => s.trim());
  const fontSize = mode === 'single_letter' ? 56 : 68;

  function getPreviewItems() {
    switch (mode) {
      case 'single_name':   return [{ text: name || 'Nome' }];
      case 'single_letter': return [{ text: (letter || 'A').repeat(letterRepeat) }];
      case 'phrase':        return [{ text: phrase || 'Frase' }];
      case 'student_list':  return [{ text: students[0] || 'Aluno', label: students[0] || 'Aluno' }];
      default:              return [{ text: '' }];
    }
  }

  function getPrintItems(): { text: string; label?: string }[] {
    switch (mode) {
      case 'single_name':   return [{ text: name || 'Nome' }];
      case 'single_letter': return [{ text: (letter || 'A').repeat(letterRepeat) }];
      case 'phrase':        return [{ text: phrase || 'Frase' }];
      case 'student_list':  return students.map((s) => ({ text: s, label: s }));
      default:              return [{ text: '' }];
    }
  }

  function buildPrintHTML(items: { text: string; label?: string }[]): string {
    const blocks = items.map((item, i) => {
      const badge = item.label ? `<div class="student-badge">✦ ${escXML(item.label)}</div>` : '';
      let rows = '';
      if (mode === 'single_letter') {
        rows = tracingSVGStrLetter(letter || 'A');
        rows += Array.from({ length: lines }, () => tracingSVGStr(item.text, fontSize, true, showLetterBox)).join('');
      } else {
        rows = tracingSVGStr(item.text, fontSize, false, showLetterBox);
        rows += Array.from({ length: lines - 1 }, () => tracingSVGStr(item.text, fontSize, true, showLetterBox)).join('');
      }
      const pb = i < items.length - 1 ? 'page-break-after:always;' : '';
      return `<div class="tracing-block" style="${pb}">${badge}${rows}</div>`;
    }).join('');

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Patrick+Hand&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
<style>${PRINT_CSS}</style></head>
<body><div class="ws">
  <div class="ws-header">
    <div>
      <div class="ws-title">${escXML(title)}</div>
      <div class="ws-subtitle">${escXML(subtitle)}</div>
    </div>
    <div style="font-size:36px;line-height:1;">✏️</div>
  </div>
  ${blocks}
  <div class="ws-footer">
    <span>Data: ___/___/______</span>
    <span>Nome: _______________________</span>
  </div>
</div></body></html>`;
  }

  function handlePrint() {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintHTML(getPrintItems()));
    win.document.close();
    setTimeout(() => win.print(), 800);
  }

  function handleDownload() {
    const blob = new Blob([buildPrintHTML(getPrintItems())], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atividade-caligrafia.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewItems = getPreviewItems();

  return (
    <div style={{ background: '#eef2f7', minHeight: '100vh', fontFamily: "var(--font-nunito, 'Nunito', sans-serif)" }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>✏️</span>
        <div>
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: '#fff', letterSpacing: 0.5, lineHeight: 1.1 }}>
            Pontiletra
          </h1>
          <p style={{ fontSize: 12, color: '#bae6fd', marginTop: 1 }}>Gerador de folhas de caligrafia</p>
        </div>
      </header>

      {/* Body */}
      <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Config panel ── */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px 22px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)',
            flex: '0 0 292px',
            width: 292,
          }}>
            <p style={{ ...lbl, marginBottom: 10 }}>Tipo de Atividade</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: '1.5px solid',
                  borderColor: mode === m ? '#0284c7' : '#dbeafe',
                  background: mode === m ? '#0284c7' : '#f0f9ff',
                  color: mode === m ? '#fff' : '#0369a1',
                  fontFamily: "var(--font-nunito, 'Nunito', sans-serif)",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  lineHeight: 1.6,
                }}>
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {mode === 'single_name' && (
              <div style={fld}>
                <label style={lbl}>Nome do Aluno</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Carolina" style={inp} />
              </div>
            )}

            {mode === 'single_letter' && (
              <div style={fld}>
                <label style={lbl}>Letra para Treinar</label>
                <input type="text" value={letter} onChange={(e) => setLetter(e.target.value || 'A')} maxLength={2}
                  style={{ ...inp, fontSize: 30, textAlign: 'center', width: 70 }} />
                <div style={{ marginTop: 12 }}>
                  <label style={lbl}>Repetições por linha: {letterRepeat}</label>
                  <input type="range" min={3} max={20} value={letterRepeat}
                    onChange={(e) => setLetterRepeat(+e.target.value)}
                    style={{ width: '100%', accentColor: '#0284c7' }} />
                </div>
              </div>
            )}

            {mode === 'phrase' && (
              <div style={fld}>
                <label style={lbl}>Frase</label>
                <textarea value={phrase} onChange={(e) => setPhrase(e.target.value)} rows={3}
                  placeholder="Ex: O gato subiu no telhado."
                  style={{ ...inp, resize: 'vertical', fontSize: 14 }} />
              </div>
            )}

            {mode === 'student_list' && (
              <div style={fld}>
                <label style={lbl}>Lista de Alunos (um por linha)</label>
                <textarea value={studentsText} onChange={(e) => setStudentsText(e.target.value)}
                  rows={7} placeholder={'Ana\nCarlos\nMariana'}
                  style={{ ...inp, resize: 'vertical', fontSize: 14 }} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                  {students.length} aluno(s) · uma folha por aluno
                </div>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0 16px' }} />
            <p style={{ ...lbl, marginBottom: 10 }}>Configurar Folha</p>

            <div style={fld}>
              <label style={lbl}>Título</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                style={{ ...inp, fontFamily: "var(--font-nunito, 'Nunito', sans-serif)", fontSize: 14 }} />
            </div>

            <div style={fld}>
              <label style={lbl}>Instrução</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                style={{ ...inp, fontFamily: "var(--font-nunito, 'Nunito', sans-serif)", fontSize: 13 }} />
            </div>

            <div style={fld}>
              <label style={lbl}>Linhas de treino: {lines}</label>
              <input type="range" min={1} max={6} value={lines}
                onChange={(e) => setLines(+e.target.value)}
                style={{ width: '100%', accentColor: '#0284c7' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20 }}>
              <input type="checkbox" id="chk-letterbox" checked={showLetterBox}
                onChange={(e) => setShowLetterBox(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0284c7', cursor: 'pointer' }} />
              <label htmlFor="chk-letterbox" style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                Quadrado por letra
              </label>
            </div>

            <button onClick={handlePrint} style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
              color: '#fff',
              fontFamily: "'Fredoka One', cursive",
              fontSize: 16,
              cursor: 'pointer',
              letterSpacing: 0.4,
              marginBottom: 8,
              boxShadow: '0 2px 8px rgba(2,132,199,0.35)',
            }}>
              🖨️ Imprimir
            </button>
            <button onClick={handleDownload} style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 10,
              border: '1.5px solid #bae6fd',
              background: '#f0f9ff',
              color: '#0284c7',
              fontFamily: "'Fredoka One', cursive",
              fontSize: 16,
              cursor: 'pointer',
            }}>
              💾 Baixar HTML
            </button>
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 9 }}>
              Ctrl+P para salvar como PDF
            </p>
          </div>

          {/* ── Preview ── */}
          <div style={{ flex: '1 1 500px' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              Pré-visualização · A4
            </p>

            {/* Paper */}
            <div style={{
              background: '#fff',
              borderRadius: 3,
              padding: '40px 48px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07)',
              maxWidth: 760,
              fontFamily: "var(--font-nunito, 'Nunito', sans-serif)",
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1.1 }}>
                    {title}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                    {subtitle}
                  </div>
                </div>
                <div style={{ fontSize: 36, lineHeight: 1, marginLeft: 16 }}>✏️</div>
              </div>
              <div style={{ borderTop: '2px solid #bae6fd', marginBottom: 16 }} />

              {previewItems.map((item, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  {'label' in item && item.label && (
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                      ✦ {item.label}
                    </div>
                  )}
                  {mode === 'single_letter' ? (
                    <>
                      <TracingRowLetter letter={letter || 'A'} />
                      {Array.from({ length: lines }, (_, j) => (
                        <TracingRow key={j} text={item.text} fontSize={fontSize} dotted={true} letterBox={showLetterBox} />
                      ))}
                    </>
                  ) : (
                    <>
                      <TracingRow text={item.text} fontSize={fontSize} dotted={false} letterBox={showLetterBox} />
                      {Array.from({ length: lines - 1 }, (_, j) => (
                        <TracingRow key={j} text={item.text} fontSize={fontSize} dotted={true} letterBox={showLetterBox} />
                      ))}
                    </>
                  )}
                </div>
              ))}

              <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 16, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
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
