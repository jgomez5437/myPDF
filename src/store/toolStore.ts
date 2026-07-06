import { create } from 'zustand'
import type { Tool } from '../types'

interface ToolState {
  currentTool: Tool
  penColor: string
  highlighterColor: string
  textDefaultColor: string
  currentWidth: number
  highlighterWidth: number
  eraserSize: number
  currentFontSize: number

  setTool: (tool: Tool) => void
  setPenColor: (color: string) => void
  setHighlighterColor: (color: string) => void
  setTextDefaultColor: (color: string) => void
  setCurrentWidth: (w: number) => void
  setHighlighterWidth: (w: number) => void
  setEraserSize: (s: number) => void
  setCurrentFontSize: (s: number) => void
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: 'select',
  penColor: '#1c1c1e',
  highlighterColor: '#ffe066',
  textDefaultColor: '#1c1c1e',
  currentWidth: 3,
  highlighterWidth: 18,
  eraserSize: 24,
  currentFontSize: 18,

  setTool: (tool) => set({ currentTool: tool }),
  setPenColor: (color) => set({ penColor: color }),
  setHighlighterColor: (color) => set({ highlighterColor: color }),
  setTextDefaultColor: (color) => set({ textDefaultColor: color }),
  setCurrentWidth: (w) => set({ currentWidth: w }),
  setHighlighterWidth: (w) => set({ highlighterWidth: w }),
  setEraserSize: (s) => set({ eraserSize: s }),
  setCurrentFontSize: (s) => set({ currentFontSize: s }),
}))
