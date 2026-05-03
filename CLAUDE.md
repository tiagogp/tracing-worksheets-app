# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Pontiletra** is a calligraphy tracing worksheet generator for Brazilian educators. The active implementation is a Next.js App Router route served at `/pontiletra`.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint CLI
```

The root route (`/`) redirects to `/pontiletra`.

## Next.js route (`app/pontiletra/`)

The route uses:
- A local font: `app/pontiletra/pontiletra.ttf` loaded via `next/font/local`, exposed as CSS variable `--font-pontiletra`
- Google Fonts at runtime: Fredoka One (headings), Patrick Hand (worksheet text), Nunito (UI body)

## Architecture

Both implementations share the same four activity modes:
- `single_name` — one student name repeated across tracing lines
- `single_letter` — a single letter repeated N times per line (font size 56px vs 68px for other modes)
- `phrase` — a free-form phrase
- `student_list` — generates one page per student (preview shows only the first)

### Core SVG generation

Each tracing row is an SVG with three guide lines (top at y=6, midline at y=h/2-2, baseline at y=h-8) and a `<text>` element rendered either solid (example row) or dotted (tracing rows via `stroke-dasharray="3 5"`).

- `TracingRow` renders SVGs inline for the preview.
- `tracingSVGStr()` generates SVG strings for the print popup HTML.

### Print/download flow

`buildPrintHTML()` assembles a complete `<!DOCTYPE html>` document with embedded CSS and SVG blocks. It creates one printable page per worksheet item, so student-list mode gets a header and footer on every student page. Printing and PDF saving both open the generated document and call `window.print()` after fonts are ready.

### XML escaping

All user input inserted into generated SVG/HTML strings goes through `escXML()` to prevent injection.

## UI language

All UI copy is in **Brazilian Portuguese**. Keep labels, placeholders, and messages in Portuguese when making changes.
