import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../../types'
import { useUiStore } from '../../store/uiStore'
import { useAppStore } from '../../store/appStore'

export function applyDisplayScale(
  pageStackEl: HTMLElement,
  stageEl: HTMLElement,
  pdfCanvas: HTMLCanvasElement,
  displayScale: number,
): void {
  if (!pdfCanvas.width) return
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, displayScale))
  pageStackEl.style.transform = `scale(${clamped})`
  stageEl.style.width = pdfCanvas.width * clamped + 'px'
  stageEl.style.height = pdfCanvas.height * clamped + 'px'
  useUiStore.getState().setDisplayScale(clamped)
}

export function fitToWidth(
  workspaceEl: HTMLElement,
  pageStackEl: HTMLElement,
  stageEl: HTMLElement,
  pdfCanvas: HTMLCanvasElement,
): void {
  if (!pdfCanvas.width) return
  const available = workspaceEl.clientWidth - 48
  let scale = available / pdfCanvas.width
  if (!isFinite(scale) || scale <= 0) scale = 1
  const clamped = Math.min(scale, 1.5)
  applyDisplayScale(pageStackEl, stageEl, pdfCanvas, clamped)
}

export function zoomIn(
  pageStackEl: HTMLElement,
  stageEl: HTMLElement,
  pdfCanvas: HTMLCanvasElement,
): void {
  const { pdfDoc } = useAppStore.getState()
  if (!pdfDoc) return
  const current = useUiStore.getState().displayScale
  applyDisplayScale(pageStackEl, stageEl, pdfCanvas, current * ZOOM_STEP)
}

export function zoomOut(
  pageStackEl: HTMLElement,
  stageEl: HTMLElement,
  pdfCanvas: HTMLCanvasElement,
): void {
  const { pdfDoc } = useAppStore.getState()
  if (!pdfDoc) return
  const current = useUiStore.getState().displayScale
  applyDisplayScale(pageStackEl, stageEl, pdfCanvas, current / ZOOM_STEP)
}
