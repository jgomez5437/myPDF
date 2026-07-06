import { loadPdfDocument, renderPage } from '../pdf-rendering/pdfRenderer'
import { useAppStore } from '../../store/appStore'
import { useToolStore } from '../../store/toolStore'
import { useHistoryStore } from '../../store/historyStore'
import { useUiStore } from '../../store/uiStore'
import { sanitizeKey } from '../../lib/uid'
import { hasStorage } from '../../lib/storage'
import { tryRestoreProgress } from '../autosave/autosaveManager'
import { fitToWidth } from '../zoom/zoomManager'

interface CanvasRefs {
  pdfCanvas: HTMLCanvasElement
  drawCanvas: HTMLCanvasElement
  pageStackEl: HTMLElement
  stageEl: HTMLElement
  textLayerEl: HTMLElement
  interactionLayerEl: HTMLElement
  workspaceEl: HTMLElement
}

export async function loadFile(file: File, refs: CanvasRefs): Promise<void> {
  const uiStore = useUiStore.getState()
  const appStore = useAppStore.getState()
  const histStore = useHistoryStore.getState()
  const toolStore = useToolStore.getState()

  try {
    uiStore.setSaveStatus('saving', 'Loading document...')
    const buf = await file.arrayBuffer()
    appStore.setPdfBytes(buf)

    const pdfDoc = await loadPdfDocument(buf)
    const numPages = pdfDoc.numPages

    const pages: Record<number, { strokes: []; textBoxes: [] }> = {}
    for (let i = 1; i <= numPages; i++) pages[i] = { strokes: [], textBoxes: [] }

    appStore.setPdfDoc(pdfDoc)
    appStore.setNumPages(numPages)
    appStore.setCurrentPage(1)
    appStore.setPages(pages as Parameters<typeof appStore.setPages>[0])
    appStore.setFileName(file.name)
    appStore.setDocId(sanitizeKey(file.name + '_' + file.size))

    histStore.setSelectedTextBoxId(null)
    uiStore.setHasDocument(true)

    tryRestoreProgress()

    await renderPage(
      1,
      pdfDoc,
      refs.pdfCanvas,
      refs.drawCanvas,
      refs.pageStackEl,
      refs.textLayerEl,
      refs.interactionLayerEl,
    )

    fitToWidth(refs.workspaceEl, refs.pageStackEl, refs.stageEl, refs.pdfCanvas)
    toolStore.setTool('select')

    uiStore.setSaveStatus(
      hasStorage ? 'saved' : 'error',
      hasStorage ? 'All changes saved' : 'Autosave unavailable in this browser',
    )
  } catch (err) {
    console.error(err)
    uiStore.showToast('Could not open that PDF. Please try a different file.')
    uiStore.setSaveStatus('error', 'Could not load document')
  }
}
