import { create } from 'zustand'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PageData } from '../types'
import { RENDER_SCALE } from '../types'

interface AppState {
  pdfDoc: PDFDocumentProxy | null
  pdfBytes: ArrayBuffer | null
  docId: string | null
  numPages: number
  currentPage: number
  scale: number
  pages: Record<number, PageData>
  fileName: string

  setPdfDoc: (doc: PDFDocumentProxy | null) => void
  setPdfBytes: (bytes: ArrayBuffer | null) => void
  setDocId: (id: string | null) => void
  setNumPages: (n: number) => void
  setCurrentPage: (n: number) => void
  setPages: (pages: Record<number, PageData>) => void
  setFileName: (name: string) => void
  updatePage: (num: number, data: PageData) => void
  resetDoc: () => void
  getCurrentPageData: () => PageData
}

export const useAppStore = create<AppState>((set, get) => ({
  pdfDoc: null,
  pdfBytes: null,
  docId: null,
  numPages: 0,
  currentPage: 1,
  scale: RENDER_SCALE,
  pages: {},
  fileName: '',

  setPdfDoc: (doc) => set({ pdfDoc: doc }),
  setPdfBytes: (bytes) => set({ pdfBytes: bytes }),
  setDocId: (id) => set({ docId: id }),
  setNumPages: (n) => set({ numPages: n }),
  setCurrentPage: (n) => set({ currentPage: n }),
  setPages: (pages) => set({ pages }),
  setFileName: (name) => set({ fileName: name }),
  updatePage: (num, data) =>
    set((s) => ({ pages: { ...s.pages, [num]: data } })),
  resetDoc: () =>
    set({
      pdfDoc: null,
      pdfBytes: null,
      docId: null,
      numPages: 0,
      currentPage: 1,
      pages: {},
      fileName: '',
    }),
  getCurrentPageData: () => {
    const { pages, currentPage } = get()
    if (!pages[currentPage]) {
      const newData: PageData = { strokes: [], textBoxes: [] }
      set((s) => ({ pages: { ...s.pages, [currentPage]: newData } }))
      return newData
    }
    return pages[currentPage]
  },
}))
