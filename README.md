# myPDF

A browser-based PDF annotation tool. Open any PDF, draw on it with a pen or highlighter, erase strokes precisely, drop in text boxes, then download the annotated file.

## Features

- **Pen & Highlighter** — freehand drawing with adjustable color and stroke width
- **Eraser** — circular eraser that cuts strokes at the exact boundary (not whole-stroke removal)
- **Text boxes** — click to place, double-click to edit, drag to reposition, per-box color and font size
- **Undo / Redo** — up to 60 history states across all tools
- **Autosave** — annotations are saved to `localStorage` keyed by filename + size, restored automatically on next open
- **Zoom** — fit-to-width, zoom in/out via buttons, `Ctrl+scroll`, or pinch-to-zoom on touch
- **Export** — bakes all annotations into a downloadable PDF using the original file's coordinate space
- **Drag & drop** — drop a PDF anywhere on the window to open it

## Tech Stack

| Layer | Library |
|---|---|
| Build | Vite 5 |
| UI | React 18 + TypeScript 5 |
| State | Zustand 4 |
| Styling | Tailwind CSS 3 |
| PDF render | pdfjs-dist 4 |
| PDF export | pdf-lib 1.17 |
| Deploy | Vercel |

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check then produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run TypeScript without emitting |

## Project Structure

```
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Root layout and keyboard shortcuts
├── styles/global.css         # Tailwind directives + CSS design tokens
├── types/index.ts            # Shared interfaces (Stroke, TextBox, RENDER_SCALE)
├── lib/                      # uid generator, localStorage wrappers
├── store/                    # Zustand stores (app, tool, history, ui)
└── features/
    ├── canvas/               # PageStack component, stroke renderer
    ├── pdf-rendering/        # pdf.js v4 integration, worker config
    ├── zoom/                 # Zoom manager, ZoomControls
    ├── tools/
    │   ├── pen/              # Pen + highlighter tool
    │   ├── eraser/           # Eraser with segment-circle intersection math
    │   └── text/             # TextBox component, TextLayer
    ├── toolbar/              # Toolbar buttons, drawing controls, page nav
    ├── file-loading/         # File open, drag & drop overlay
    ├── history/              # Undo/redo manager
    ├── autosave/             # Debounced localStorage persistence
    ├── export/               # PDF export via pdf-lib
    └── shared/               # Toast notification
```

## Deployment

The app is a static SPA deployed on Vercel. `vercel.json` sets the build command, output directory, and an SPA rewrite rule.

```bash
# Production build (also runs on Vercel CI)
npm run build
```

The `dist/` folder contains everything needed to serve the app, including the pdf.js worker file bundled as a separate chunk.

## Key Implementation Notes

**Coordinate system** — All annotation coordinates are stored in render-space (canvas pixels at `RENDER_SCALE = 2.5`). The PDF exporter divides by `2.5` and flips the Y-axis to convert back to PDF point space. This constant must not change without migrating existing `localStorage` data.

**localStorage keys** — Saved as `mypdf_<sanitized filename>_<filesize>`. The key format must stay stable or existing annotations will not restore.

**Drawing performance** — Pointer event handlers are attached imperatively (not via React props) and all drawing-loop variables are module-level refs, keeping React renders out of the 60fps draw path.
