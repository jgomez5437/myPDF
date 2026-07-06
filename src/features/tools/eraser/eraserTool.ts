import type { Point, Stroke, PageData } from '../../../types'
import { uid } from '../../../lib/uid'
import { useAppStore } from '../../../store/appStore'
import { useToolStore } from '../../../store/toolStore'
import { useUiStore } from '../../../store/uiStore'
import { redrawOverlay } from '../../canvas/strokeRenderer'
import { scheduleAutosave } from '../../autosave/autosaveManager'
import { pushHistory } from '../../history/historyManager'
import { getDocCoords } from '../pen/penTool'

const isErasingRef = { current: false }

function segmentCircleIntersections(p1: Point, p2: Point, cx: number, cy: number, r: number): Point[] {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const a = dx * dx + dy * dy
  if (a === 0) return []
  const fx = p1.x - cx
  const fy = p1.y - cy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - r * r
  let disc = b * b - 4 * a * c
  if (disc < 0) return []
  disc = Math.sqrt(disc)
  const t1 = (-b - disc) / (2 * a)
  const t2 = (-b + disc) / (2 * a)
  const ts: number[] = []
  if (t1 >= 0 && t1 <= 1) ts.push(t1)
  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-9) ts.push(t2)
  ts.sort((a, b) => a - b)
  return ts.map((t) => ({ x: p1.x + dx * t, y: p1.y + dy * t }))
}

function eraseStrokeAgainstCircle(
  points: Point[],
  cx: number,
  cy: number,
  r: number,
): { groups: Point[][]; touched: boolean } {
  const dist = (p: Point) => Math.hypot(p.x - cx, p.y - cy)
  const groups: Point[][] = []
  let current: Point[] = []
  let touched = false
  let prevInside: boolean | null = null
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const pInside = dist(p) <= r
    if (pInside) touched = true
    if (i === 0) {
      if (!pInside) current.push(p)
      prevInside = pInside
      continue
    }
    const prev = points[i - 1]
    if (prevInside && pInside) {
      // fully inside, nothing to draw
    } else if (!prevInside && !pInside) {
      const ints = segmentCircleIntersections(prev, p, cx, cy, r)
      if (ints.length >= 2) {
        touched = true
        current.push(ints[0])
        groups.push(current)
        current = [ints[1], p]
      } else {
        current.push(p)
      }
    } else if (!prevInside && pInside) {
      const ints = segmentCircleIntersections(prev, p, cx, cy, r)
      if (ints.length >= 1) current.push(ints[0])
      if (current.length >= 2) groups.push(current)
      current = []
    } else {
      const ints = segmentCircleIntersections(prev, p, cx, cy, r)
      current = ints.length >= 1 ? [ints[ints.length - 1], p] : [p]
    }
    prevInside = pInside
  }
  if (current.length >= 2) groups.push(current)
  return { groups, touched }
}

export function eraseAtRadius(pageData: PageData, x: number, y: number, r: number): boolean {
  let changed = false
  const newStrokes: Stroke[] = []
  for (const stroke of pageData.strokes) {
    const { groups, touched } = eraseStrokeAgainstCircle(stroke.points, x, y, r)
    if (!touched) {
      newStrokes.push(stroke)
      continue
    }
    changed = true
    for (const g of groups) {
      if (g.length >= 2) {
        newStrokes.push({
          id: uid(),
          color: stroke.color,
          width: stroke.width,
          opacity: stroke.opacity,
          cap: stroke.cap,
          points: g,
        })
      }
    }
  }
  if (changed) pageData.strokes = newStrokes
  return changed
}

function performErase(e: PointerEvent, pageStackEl: HTMLElement, drawCanvas: HTMLCanvasElement): void {
  const { x, y } = getDocCoords(e, pageStackEl)
  const appStore = useAppStore.getState()
  const pd = { ...appStore.getCurrentPageData() }
  eraseAtRadius(pd, x, y, useToolStore.getState().eraserSize)
  appStore.updatePage(appStore.currentPage, pd)
  redrawOverlay(drawCanvas, pd.strokes)
}

export function onEraserDown(
  e: PointerEvent,
  pageStackEl: HTMLElement,
  interactionLayerEl: HTMLElement,
  drawCanvas: HTMLCanvasElement,
): void {
  pushHistory()
  isErasingRef.current = true
  interactionLayerEl.setPointerCapture(e.pointerId)
  const { x, y } = getDocCoords(e, pageStackEl)
  useUiStore.getState().setEraserPos({ x, y })
  useUiStore.getState().setEraserActive(true)
  performErase(e, pageStackEl, drawCanvas)
}

export function onEraserMove(
  e: PointerEvent,
  pageStackEl: HTMLElement,
  drawCanvas: HTMLCanvasElement,
): void {
  const { x, y } = getDocCoords(e, pageStackEl)
  useUiStore.getState().setEraserPos({ x, y })
  useUiStore.getState().setEraserActive(true)
  if (!isErasingRef.current) return
  performErase(e, pageStackEl, drawCanvas)
}

export function onEraserUp(e: PointerEvent): void {
  if (!isErasingRef.current) return
  isErasingRef.current = false
  if (e.pointerType !== 'mouse') {
    useUiStore.getState().setEraserActive(false)
  }
  scheduleAutosave()
}

export function onEraserLeave(): void {
  if (!isErasingRef.current) {
    useUiStore.getState().setEraserActive(false)
  }
}

export function getIsErasing(): boolean {
  return isErasingRef.current
}
