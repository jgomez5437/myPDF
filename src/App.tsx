import { useRef, useEffect } from 'react'
import { FileControls } from './features/file-loading/FileControls'
import { DropOverlay } from './features/file-loading/DropOverlay'
import { ExportButton } from './features/export/ExportButton'
import { ToolButtons } from './features/toolbar/ToolButtons'
import { DrawingControls } from './features/toolbar/DrawingControls'
import { HistoryButtons } from './features/toolbar/HistoryButtons'
import { PageNav } from './features/toolbar/PageNav'
import { ZoomControls } from './features/zoom/ZoomControls'
import { PageStack, type PageStackHandle } from './features/canvas/PageStack'
import { Toast } from './features/shared/Toast'
import { loadFile } from './features/file-loading/fileLoader'
import { undo, redo } from './features/history/historyManager'
import { useAppStore } from './store/appStore'
import { useHistoryStore } from './store/historyStore'
import { useUiStore } from './store/uiStore'
import { scheduleAutosave } from './features/autosave/autosaveManager'
import { pushHistory } from './features/history/historyManager'

export default function App() {
  const pageStackRef = useRef<PageStackHandle>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  const { saveStatus, saveText, hasDocument } = useUiStore()
  const { pdfDoc, numPages, setCurrentPage } = useAppStore()

  async function handleFile(file: File) {
    const refs = pageStackRef.current?.getCanvasRefs()
    if (!refs) return
    await loadFile(file, refs)
  }

  async function handleNavigate(page: number) {
    if (!pdfDoc || page < 1 || page > numPages) return
    setCurrentPage(page)
    await pageStackRef.current?.renderPage(page, pdfDoc)
    pageStackRef.current?.fitToWidth()
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null
      const isEditingText =
        activeEl?.classList.contains('tb-content-editing') ||
        (activeEl?.isContentEditable && activeEl.contentEditable === 'true')
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (mod && e.key.toLowerCase() === 'y') ||
        (mod && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        redo()
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !isEditingText
      ) {
        const selectedId = useHistoryStore.getState().selectedTextBoxId
        if (selectedId) {
          e.preventDefault()
          pushHistory()
          const appStore = useAppStore.getState()
          const pd = appStore.getCurrentPageData()
          appStore.updatePage(appStore.currentPage, {
            ...pd,
            textBoxes: pd.textBoxes.filter((t) => t.id !== selectedId),
          })
          useHistoryStore.getState().setSelectedTextBoxId(null)
          scheduleAutosave()
        }
      } else if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        pageStackRef.current?.zoomIn()
      } else if (mod && e.key === '-') {
        e.preventDefault()
        pageStackRef.current?.zoomOut()
      } else if (mod && e.key === '0') {
        e.preventDefault()
        pageStackRef.current?.fitToWidth()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const dotClass = {
    idle: 'bg-[#c4c7cf]',
    saving: 'bg-warm animate-pulse',
    saved: 'bg-success',
    error: 'bg-danger',
  }[saveStatus]

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-5 px-5 py-3 bg-paper border-b border-[var(--border)] flex-wrap">
        <div className="flex items-center gap-2 mr-1">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 2H16L21 7V24H5V2Z" fill="#ffffff" stroke="#16161a" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M16 2V7H21" fill="none" stroke="#16161a" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M7.5 20.5L17.5 10.5L20 13L10 23L7 23.5L7.5 20.5Z" fill="#f0a63d" stroke="#16161a" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <span className="font-display font-bold text-[19px] tracking-tight">MyPDF</span>
        </div>

        <FileControls onFile={handleFile} />

        <div className="flex items-center gap-2 ml-auto text-[13px] text-[var(--text-muted)]">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
          <span>{saveText}</span>
        </div>

        <ExportButton />
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-5 px-5 py-2.5 bg-panel flex-wrap">
        <div className="flex items-center gap-2 pr-5 border-r border-[var(--panel-line)]">
          <ToolButtons />
        </div>
        <div className="flex items-center gap-2 pr-5 border-r border-[var(--panel-line)]">
          <DrawingControls />
        </div>
        <div className="flex items-center gap-2 pr-5 border-r border-[var(--panel-line)]">
          <HistoryButtons />
        </div>
        <div className="flex items-center gap-2 pr-5 border-r border-[var(--panel-line)]">
          <ZoomControls
            onZoomIn={() => pageStackRef.current?.zoomIn()}
            onZoomOut={() => pageStackRef.current?.zoomOut()}
            onFit={() => pageStackRef.current?.fitToWidth()}
          />
        </div>
        <PageNav onNavigate={handleNavigate} />
      </div>

      {/* Workspace */}
      <main
        ref={workspaceRef}
        className="flex-1 overflow-auto relative bg-workspace"
        style={{ padding: '32px 24px' }}
      >
        {!hasDocument && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[var(--text-muted)]">
            <p className="mb-4">Open a PDF to start marking it up, or drop one anywhere on the screen.</p>
            <button
              className="text-[13.5px] font-semibold border-none rounded-lg px-4 py-2 cursor-pointer
                         bg-accent text-white hover:bg-[var(--accent-strong)] transition-colors"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            >
              Open PDF
            </button>
          </div>
        )}

        <div
          ref={stageRef}
          style={{ display: hasDocument ? 'block' : 'none' }}
        >
          <PageStack ref={pageStackRef} stageRef={stageRef} workspaceRef={workspaceRef} />
        </div>
      </main>

      <DropOverlay onFile={handleFile} />
      <Toast />
    </div>
  )
}
