import type { Stroke, Point } from '../../../types'
import { uid } from '../../../lib/uid'
import { useAppStore } from '../../../store/appStore'
import { useToolStore } from '../../../store/toolStore'
import { redrawOverlay } from '../../canvas/strokeRenderer'
import { scheduleAutosave } from '../../autosave/autosaveManager'
import { pushHistory } from '../../history/historyManager'

const isDrawingRef = { current: false }
const currentStrokeRef: { current: Stroke | null } = { current: null }

export function getDocCoords(evt: PointerEvent, pageStackEl: HTMLElement): Point {
  const rect = pageStackEl.getBoundingClientRect()
  const scaleX = pageStackEl.offsetWidth / rect.width
  const scaleY = pageStackEl.offsetHeight / rect.height
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  }
}

function getStrokeConfig() {
  const { currentTool, penColor, highlighterColor, currentWidth, highlighterWidth } =
    useToolStore.getState()
  if (currentTool === 'highlighter') {
    return { color: highlighterColor, width: highlighterWidth, opacity: 0.38, cap: 'butt' as const }
  }
  return { color: penColor, width: currentWidth, opacity: 1, cap: 'round' as const }
}

export function onPenDown(
  e: PointerEvent,
  pageStackEl: HTMLElement,
  interactionLayerEl: HTMLElement,
): void {
  pushHistory()
  isDrawingRef.current = true
  const { x, y } = getDocCoords(e, pageStackEl)
  const cfg = getStrokeConfig()
  currentStrokeRef.current = {
    id: uid(),
    color: cfg.color,
    width: cfg.width,
    opacity: cfg.opacity,
    cap: cfg.cap,
    points: [{ x, y }],
  }
  interactionLayerEl.setPointerCapture(e.pointerId)
}

export function onPenMove(
  e: PointerEvent,
  pageStackEl: HTMLElement,
  drawCanvas: HTMLCanvasElement,
): void {
  if (!isDrawingRef.current || !currentStrokeRef.current) return
  const { x, y } = getDocCoords(e, pageStackEl)
  currentStrokeRef.current.points.push({ x, y })
  const strokes = useAppStore.getState().getCurrentPageData().strokes
  redrawOverlay(drawCanvas, strokes, currentStrokeRef.current)
}

export function onPenUp(drawCanvas: HTMLCanvasElement): void {
  if (!isDrawingRef.current) return
  isDrawingRef.current = false
  const stroke = currentStrokeRef.current
  if (stroke && stroke.points.length >= 2) {
    const appStore = useAppStore.getState()
    const pd = appStore.getCurrentPageData()
    appStore.updatePage(appStore.currentPage, {
      ...pd,
      strokes: [...pd.strokes, stroke],
    })
  }
  currentStrokeRef.current = null
  const strokes = useAppStore.getState().getCurrentPageData().strokes
  redrawOverlay(drawCanvas, strokes)
  scheduleAutosave()
}

export function isPinchActive(): boolean {
  return isDrawingRef.current
}
