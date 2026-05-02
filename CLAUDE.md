# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Pontiletra** is a calligraphy tracing worksheet generator for Brazilian educators. It has two independent implementations that share the same feature set and UI design:

- `tracing_worksheet_generator.html` — self-contained vanilla JS file, no build step, embeddable in tools like Notion or WordPress
- `app/pontiletra/` — Next.js App Router route (TypeScript/React) served at `/pontiletra`

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

The root route (`/`) redirects to `/pontiletra`.

## Running the HTML version

Open `tracing_worksheet_generator.html` directly in a browser — no server needed.

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

- React version: `TracingRow` component renders SVGs inline; `tracingSVGStr()` generates SVG strings for the print popup HTML
- HTML version: `tracingSVG(text, fontSize, mode)` where `mode` is `'solid'` or `'dotted'`

### Print/download flow

`buildPrintHTML()` (React) / `buildPrintHTML` in the HTML version assembles a complete `<!DOCTYPE html>` document with embedded CSS and SVG blocks. For printing, it opens a new window and calls `window.print()` after a 800ms delay. Download uses `Blob` + object URL.

### XML escaping

All user input inserted into SVG `<text>` elements goes through `escXML()` to prevent injection — this is present in both implementations.

## UI language

All UI copy is in **Brazilian Portuguese**. Keep labels, placeholders, and messages in Portuguese when making changes.
