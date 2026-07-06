import type { Stroke } from '../../types'

export function drawStrokePath(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.points.length === 0) return
  ctx.beginPath()
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
  }
  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.width
  ctx.lineCap = stroke.cap ?? 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = stroke.opacity ?? 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

export function redrawOverlay(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  liveStroke: Stroke | null = null,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const stroke of strokes) drawStrokePath(ctx, stroke)
  if (liveStroke) drawStrokePath(ctx, liveStroke)
}
