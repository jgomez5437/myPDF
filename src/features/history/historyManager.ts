import { useAppStore } from '../../store/appStore'
import { useHistoryStore } from '../../store/historyStore'
import { redrawOverlay } from '../canvas/strokeRenderer'
import { scheduleAutosave } from '../autosave/autosaveManager'

let drawCanvasRef: HTMLCanvasElement | null = null

export function setDrawCanvasRef(canvas: HTMLCanvasElement): void {
  drawCanvasRef = canvas
}

export function pushHistory(): void {
  const { pdfDoc, pages } = useAppStore.getState()
  if (!pdfDoc) return
  useHistoryStore.getState().pushHistory(JSON.stringify(pages))
}

function afterRestore(): void {
  if (drawCanvasRef) {
    const strokes = useAppStore.getState().getCurrentPageData().strokes
    redrawOverlay(drawCanvasRef, strokes)
  }
  scheduleAutosave()
}

export function undo(): void {
  const histStore = useHistoryStore.getState()
  const appStore = useAppStore.getState()
  if (histStore.historyStack.length === 0) return
  histStore.pushRedo(JSON.stringify(appStore.pages))
  const snapshot = histStore.popHistory()
  if (!snapshot) return
  appStore.setPages(JSON.parse(snapshot) as typeof appStore.pages)
  histStore.setSelectedTextBoxId(null)
  afterRestore()
}

export function redo(): void {
  const histStore = useHistoryStore.getState()
  const appStore = useAppStore.getState()
  if (histStore.redoStack.length === 0) return
  histStore.pushHistory(JSON.stringify(appStore.pages))
  const snapshot = histStore.popRedo()
  if (!snapshot) return
  appStore.setPages(JSON.parse(snapshot) as typeof appStore.pages)
  histStore.setSelectedTextBoxId(null)
  afterRestore()
}
