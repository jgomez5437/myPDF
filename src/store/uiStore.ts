import { create } from 'zustand'
import type { SaveStatus } from '../types'

interface EraserPos {
  x: number
  y: number
}

interface UiState {
  displayScale: number
  saveStatus: SaveStatus
  saveText: string
  toastMessage: string
  toastVisible: boolean
  eraserPos: EraserPos | null
  eraserActive: boolean
  hasDocument: boolean

  setDisplayScale: (s: number) => void
  setSaveStatus: (status: SaveStatus, text: string) => void
  showToast: (msg: string) => void
  hideToast: () => void
  setEraserPos: (pos: EraserPos | null) => void
  setEraserActive: (active: boolean) => void
  setHasDocument: (has: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  displayScale: 1,
  saveStatus: 'idle',
  saveText: 'No document',
  toastMessage: '',
  toastVisible: false,
  eraserPos: null,
  eraserActive: false,
  hasDocument: false,

  setDisplayScale: (s) => set({ displayScale: s }),
  setSaveStatus: (status, text) => set({ saveStatus: status, saveText: text }),
  showToast: (msg) => set({ toastMessage: msg, toastVisible: true }),
  hideToast: () => set({ toastVisible: false }),
  setEraserPos: (pos) => set({ eraserPos: pos }),
  setEraserActive: (active) => set({ eraserActive: active }),
  setHasDocument: (has) => set({ hasDocument: has }),
}))
