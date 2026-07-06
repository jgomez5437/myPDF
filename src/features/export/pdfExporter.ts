import { PDFDocument, StandardFonts, LineCapStyle, rgb } from 'pdf-lib'
import { RENDER_SCALE } from '../../types'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

function hexToRgbObj(hex: string) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const bigint = parseInt(full, 16) || 0
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255
  return rgb(r, g, b)
}

function sanitizeForStandardFont(str: string): string {
  return str.replace(/[^\x00-\xFF]/g, '?')
}

function downloadBlob(bytes: ArrayBuffer, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function exportPdf(): Promise<void> {
  const appStore = useAppStore.getState()
  const uiStore = useUiStore.getState()
  if (!appStore.pdfBytes) return

  try {
    uiStore.setSaveStatus('saving', 'Preparing download...')
    const S = RENDER_SCALE

    const outDoc = await PDFDocument.load(appStore.pdfBytes.slice(0))
    const font = await outDoc.embedFont(StandardFonts.Helvetica)
    const pdfPages = outDoc.getPages()

    for (let i = 0; i < pdfPages.length; i++) {
      const pageNum = i + 1
      const pageData = appStore.pages[pageNum]
      if (!pageData) continue
      const page = pdfPages[i]
      const { height: ph } = page.getSize()

      for (const stroke of pageData.strokes) {
        const pts = stroke.points
        const color = hexToRgbObj(stroke.color)
        const thickness = Math.max(stroke.width / S, 0.5)
        const opacity = stroke.opacity ?? 1
        const cap = stroke.cap === 'butt' ? LineCapStyle.Butt : LineCapStyle.Round
        for (let j = 0; j < pts.length - 1; j++) {
          page.drawLine({
            start: { x: pts[j].x / S, y: ph - pts[j].y / S },
            end: { x: pts[j + 1].x / S, y: ph - pts[j + 1].y / S },
            thickness,
            color,
            opacity,
            lineCap: cap,
          })
        }
      }

      for (const tb of pageData.textBoxes) {
        if (!tb.text || !tb.text.trim()) continue
        const fontSizePt = Math.max(tb.fontSize / S, 4)
        const color = hexToRgbObj(tb.color)
        const topY = ph - tb.y / S
        const lines = sanitizeForStandardFont(tb.text).split('\n')
        lines.forEach((line, idx) => {
          const baselineY = topY - fontSizePt * 0.9 - idx * fontSizePt * 1.25
          if (baselineY < -fontSizePt) return
          try {
            page.drawText(line, { x: tb.x / S, y: baselineY, size: fontSizePt, font, color })
          } catch {
            // skip unsupported line
          }
        })
      }
    }

    const saved = await outDoc.save()
    const base = (appStore.fileName || 'document').replace(/\.pdf$/i, '')
    downloadBlob(saved.buffer as ArrayBuffer, base + '-edited.pdf')
    uiStore.setSaveStatus('saved', 'All changes saved')
    uiStore.showToast('Your edited PDF has been downloaded.')
  } catch (err) {
    console.error(err)
    uiStore.setSaveStatus('error', 'Download failed')
    uiStore.showToast('Something went wrong preparing the download. Please try again.')
  }
}
