import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useToolStore } from '../../store/toolStore'
import { useUiStore } from '../../store/uiStore'
import { useAppStore } from '../../store/appStore'
import { useHistoryStore } from '../../store/historyStore'
import { onPenDown, onPenMove, onPenUp } from '../tools/pen/penTool'
import { onEraserDown, onEraserMove, onEraserUp, onEraserLeave, getIsErasing } from '../tools/eraser/eraserTool'
import { setDrawCanvasRef } from '../history/historyManager'
import { TextLayer } from '../tools/text/TextLayer'
import { uid } from '../../lib/uid'
import { pushHistory } from '../history/historyManager'
import { scheduleAutosave } from '../autosave/autosaveManager'
import { ZOOM_MIN, ZOOM_MAX } from '../../types'
import { applyDisplayScale, fitToWidth as _fitToWidth, zoomIn as _zoomIn, zoomOut as _zoomOut } from '../zoom/zoomManager'
import { renderPage as _renderPage } from '../pdf-rendering/pdfRenderer'
import { redrawOverlay } from './strokeRenderer'

export interface PageStackHandle {
  renderPage: (num: number, pdfDoc: PDFDocumentProxy) => Promise<void>
  fitToWidth: () => void
  zoomIn: () => void
  zoomOut: () => void
  getCanvasRefs: () => {
    pdfCanvas: HTMLCanvasElement
    drawCanvas: HTMLCanvasElement
    pageStackEl: HTMLElement
    stageEl: HTMLElement
    textLayerEl: HTMLElement
    interactionLayerEl: HTMLElement
    workspaceEl: HTMLElement
  } | null
}

interface Props {
  stageRef: React.RefObject<HTMLDivElement | null>
  workspaceRef: React.RefObject<HTMLDivElement | null>
}

const activeTouchPointers = new Map<number, { x: number; y: number }>()
let pinchActive = false
let pinchStartDist = 0
let pinchStartZoom = 1

function touchPointsDistance() {
  const pts = Array.from(activeTouchPointers.values())
  if (pts.length < 2) return 0
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
}

export const PageStack = forwardRef<PageStackHandle, Props>(function PageStack(
  { stageRef, workspaceRef },
  ref,
) {
  const pageStackRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const interactionLayerRef = useRef<HTMLDivElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)

  const currentTool = useToolStore((s) => s.currentTool)
  const eraserSize = useToolStore((s) => s.eraserSize)
  const eraserPos = useUiStore((s) => s.eraserPos)
  const eraserActive = useUiStore((s) => s.eraserActive)
  const displayScale = useUiStore((s) => s.displayScale)
  const hasDocument = useUiStore((s) => s.hasDocument)
  const { setSelectedTextBoxId } = useHistoryStore()
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)

  // Register draw canvas for history manager
  useEffect(() => {
    if (drawCanvasRef.current) setDrawCanvasRef(drawCanvasRef.current)
  }, [])

  // Expose imperative API to parent
  useImperativeHandle(ref, () => ({
    renderPage: async (num: number, pdfDoc: PDFDocumentProxy) => {
      if (!pdfCanvasRef.current || !drawCanvasRef.current || !pageStackRef.current ||
          !textLayerRef.current || !interactionLayerRef.current) return
      await _renderPage(
        num, pdfDoc,
        pdfCanvasRef.current, drawCanvasRef.current,
        pageStackRef.current, textLayerRef.current, interactionLayerRef.current,
      )
      const { pages } = useAppStore.getState()
      const strokes = pages[num]?.strokes ?? []
      redrawOverlay(drawCanvasRef.current, strokes)
    },
    fitToWidth: () => {
      if (!workspaceRef.current || !pageStackRef.current || !stageRef.current || !pdfCanvasRef.current) return
      _fitToWidth(workspaceRef.current, pageStackRef.current, stageRef.current, pdfCanvasRef.current)
    },
    zoomIn: () => {
      if (!pageStackRef.current || !stageRef.current || !pdfCanvasRef.current) return
      _zoomIn(pageStackRef.current, stageRef.current, pdfCanvasRef.current)
    },
    zoomOut: () => {
      if (!pageStackRef.current || !stageRef.current || !pdfCanvasRef.current) return
      _zoomOut(pageStackRef.current, stageRef.current, pdfCanvasRef.current)
    },
    getCanvasRefs: () => {
      if (!pdfCanvasRef.current || !drawCanvasRef.current || !pageStackRef.current ||
          !stageRef.current || !textLayerRef.current || !interactionLayerRef.current ||
          !workspaceRef.current) return null
      return {
        pdfCanvas: pdfCanvasRef.current,
        drawCanvas: drawCanvasRef.current,
        pageStackEl: pageStackRef.current,
        stageEl: stageRef.current,
        textLayerEl: textLayerRef.current,
        interactionLayerEl: interactionLayerRef.current,
        workspaceEl: workspaceRef.current,
      }
    },
  }))

  // Interaction layer cursor + pointer-events
  useEffect(() => {
    const el = interactionLayerRef.current
    if (!el) return
    const drawing = currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser'
    el.style.pointerEvents = drawing || currentTool === 'text' ? 'auto' : 'none'
    el.style.cursor =
      currentTool === 'pen' || currentTool === 'highlighter'
        ? 'crosshair'
        : currentTool === 'eraser'
        ? 'cell'
        : currentTool === 'text'
        ? 'text'
        : 'default'
  }, [currentTool])

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!pdfCanvasRef.current || !interactionLayerRef.current || !pageStackRef.current) return
      if (currentTool === 'pen' || currentTool === 'highlighter') {
        onPenDown(e, pageStackRef.current, interactionLayerRef.current)
      } else if (currentTool === 'eraser') {
        onEraserDown(e, pageStackRef.current, interactionLayerRef.current, drawCanvasRef.current!)
      }
    },
    [currentTool],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!pageStackRef.current || !drawCanvasRef.current) return
      if (currentTool === 'pen' || currentTool === 'highlighter') {
        onPenMove(e, pageStackRef.current, drawCanvasRef.current)
      } else if (currentTool === 'eraser') {
        onEraserMove(e, pageStackRef.current, drawCanvasRef.current)
      }
    },
    [currentTool],
  )

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (currentTool === 'pen' || currentTool === 'highlighter') {
        onPenUp(drawCanvasRef.current!)
      } else if (currentTool === 'eraser') {
        onEraserUp(e)
      }
    },
    [currentTool],
  )

  const handlePointerLeave = useCallback(() => {
    if (currentTool === 'eraser') onEraserLeave()
  }, [currentTool])

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (currentTool !== 'text' || !pageStackRef.current) return
      const rect = pageStackRef.current.getBoundingClientRect()
      const scaleX = pageStackRef.current.offsetWidth / rect.width
      const scaleY = pageStackRef.current.offsetHeight / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      pushHistory()
      const newId = uid()
      const { currentFontSize, textDefaultColor } = useToolStore.getState()
      const appStore = useAppStore.getState()
      const pd = appStore.getCurrentPageData()
      appStore.updatePage(appStore.currentPage, {
        ...pd,
        textBoxes: [
          ...pd.textBoxes,
          { id: newId, x, y, width: 220, text: '', color: textDefaultColor, fontSize: currentFontSize },
        ],
      })
      setSelectedTextBoxId(newId)
      useToolStore.getState().setTool('select')
      setAutoFocusId(newId)
      scheduleAutosave()
      setTimeout(() => setAutoFocusId(null), 100)
    },
    [currentTool, setSelectedTextBoxId],
  )

  useEffect(() => {
    const el = interactionLayerRef.current
    if (!el) return
    el.addEventListener('pointerdown', handlePointerDown, { passive: false })
    el.addEventListener('pointermove', handlePointerMove, { passive: false })
    el.addEventListener('pointerup', handlePointerUp)
    el.addEventListener('pointercancel', handlePointerUp)
    el.addEventListener('pointerleave', handlePointerLeave)
    el.addEventListener('click', handleClick as EventListener)
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerup', handlePointerUp)
      el.removeEventListener('pointercancel', handlePointerUp)
      el.removeEventListener('pointerleave', handlePointerLeave)
      el.removeEventListener('click', handleClick as EventListener)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave, handleClick])

  // Pinch-to-zoom on workspace (capture phase)
  useEffect(() => {
    const ws = workspaceRef.current
    if (!ws) return

    function onWsPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'touch' || !hasDocument) return
      activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (activeTouchPointers.size === 2) {
        if (getIsErasing()) onEraserUp(e)
        pinchActive = true
        pinchStartDist = touchPointsDistance()
        pinchStartZoom = useUiStore.getState().displayScale
        e.stopPropagation()
      } else if (activeTouchPointers.size > 2) {
        e.stopPropagation()
      }
    }
    function onWsPointerMove(e: PointerEvent) {
      if (!activeTouchPointers.has(e.pointerId)) return
      activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pinchActive && activeTouchPointers.size === 2 && pinchStartDist > 0) {
        const dist = touchPointsDistance()
        const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchStartZoom * (dist / pinchStartDist)))
        if (pageStackRef.current && stageRef.current && pdfCanvasRef.current) {
          applyDisplayScale(pageStackRef.current, stageRef.current, pdfCanvasRef.current, newScale)
        }
        e.stopPropagation()
        e.preventDefault()
      }
    }
    function endTouchPointer(e: PointerEvent) {
      if (!activeTouchPointers.has(e.pointerId)) return
      activeTouchPointers.delete(e.pointerId)
      if (activeTouchPointers.size < 2) {
        pinchActive = false
        pinchStartDist = 0
      }
    }

    ws.addEventListener('pointerdown', onWsPointerDown, true)
    ws.addEventListener('pointermove', onWsPointerMove, true)
    ws.addEventListener('pointerup', endTouchPointer, true)
    ws.addEventListener('pointercancel', endTouchPointer, true)
    return () => {
      ws.removeEventListener('pointerdown', onWsPointerDown, true)
      ws.removeEventListener('pointermove', onWsPointerMove, true)
      ws.removeEventListener('pointerup', endTouchPointer, true)
      ws.removeEventListener('pointercancel', endTouchPointer, true)
    }
  }, [hasDocument, stageRef, workspaceRef])

  // Ctrl+scroll zoom on workspace
  useEffect(() => {
    const ws = workspaceRef.current
    if (!ws) return
    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey) || !hasDocument) return
      e.preventDefault()
      if (!pageStackRef.current || !stageRef.current || !pdfCanvasRef.current) return
      if (e.deltaY < 0) _zoomIn(pageStackRef.current, stageRef.current, pdfCanvasRef.current)
      else _zoomOut(pageStackRef.current, stageRef.current, pdfCanvasRef.current)
    }
    ws.addEventListener('wheel', onWheel, { passive: false })
    return () => ws.removeEventListener('wheel', onWheel)
  }, [hasDocument, stageRef, workspaceRef])

  // Resize handler
  useEffect(() => {
    function onResize() {
      if (!pageStackRef.current || !stageRef.current || !pdfCanvasRef.current) return
      applyDisplayScale(pageStackRef.current, stageRef.current, pdfCanvasRef.current, displayScale)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [displayScale, stageRef])

  function handlePageStackPointerDown(e: React.PointerEvent) {
    if (
      currentTool === 'select' &&
      (e.target === pdfCanvasRef.current || e.target === drawCanvasRef.current)
    ) {
      setSelectedTextBoxId(null)
    }
  }

  return (
    <div
      ref={pageStackRef}
      className="relative shadow-xl"
      style={{ transformOrigin: 'top left' }}
      onPointerDown={handlePageStackPointerDown}
    >
      <canvas ref={pdfCanvasRef} className="absolute top-0 left-0 bg-paper block" />
      <canvas ref={drawCanvasRef} className="absolute top-0 left-0 block" />
      <div ref={textLayerRef} className="absolute top-0 left-0 w-full h-full">
        <TextLayer pageStackEl={pageStackRef.current} autoFocusId={autoFocusId} />
      </div>
      <div ref={interactionLayerRef} className="absolute inset-0 z-10" />
      {eraserActive && eraserPos && currentTool === 'eraser' && (
        <div
          className="absolute border-2 border-danger bg-danger/[0.14] rounded-full pointer-events-none z-20"
          style={{
            width: eraserSize * 2,
            height: eraserSize * 2,
            left: eraserPos.x,
            top: eraserPos.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  )
})
