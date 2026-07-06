import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { RENDER_SCALE } from '../../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export { pdfjsLib }

export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const task = pdfjsLib.getDocument({ data: data.slice(0) })
  return task.promise
}

export async function renderPage(
  num: number,
  pdfDoc: PDFDocumentProxy,
  pdfCanvas: HTMLCanvasElement,
  drawCanvas: HTMLCanvasElement,
  pageStackEl: HTMLElement,
  textLayerEl: HTMLElement,
  interactionLayerEl: HTMLElement,
): Promise<void> {
  const page = await pdfDoc.getPage(num)
  const viewport = page.getViewport({ scale: RENDER_SCALE })

  pdfCanvas.width = viewport.width
  pdfCanvas.height = viewport.height
  drawCanvas.width = viewport.width
  drawCanvas.height = viewport.height
  pageStackEl.style.width = viewport.width + 'px'
  pageStackEl.style.height = viewport.height + 'px'
  textLayerEl.style.width = viewport.width + 'px'
  textLayerEl.style.height = viewport.height + 'px'
  interactionLayerEl.style.width = viewport.width + 'px'
  interactionLayerEl.style.height = viewport.height + 'px'

  const ctx = pdfCanvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
}
