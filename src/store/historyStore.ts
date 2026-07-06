import { create } from 'zustand'

const MAX_HISTORY = 60

interface HistoryState {
  historyStack: string[]
  redoStack: string[]
  selectedTextBoxId: string | null

  pushHistory: (pagesSnapshot: string) => void
  popHistory: () => string | null
  pushRedo: (snapshot: string) => void
  popRedo: () => string | null
  clearRedo: () => void
  setSelectedTextBoxId: (id: string | null) => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  historyStack: [],
  redoStack: [],
  selectedTextBoxId: null,

  pushHistory: (snapshot) =>
    set((s) => {
      const stack = [...s.historyStack, snapshot]
      if (stack.length > MAX_HISTORY) stack.shift()
      return { historyStack: stack, redoStack: [] }
    }),
  popHistory: () => {
    const { historyStack } = get()
    if (historyStack.length === 0) return null
    const last = historyStack[historyStack.length - 1]
    set((s) => ({ historyStack: s.historyStack.slice(0, -1) }))
    return last
  },
  pushRedo: (snapshot) =>
    set((s) => ({ redoStack: [...s.redoStack, snapshot] })),
  popRedo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return null
    const last = redoStack[redoStack.length - 1]
    set((s) => ({ redoStack: s.redoStack.slice(0, -1) }))
    return last
  },
  clearRedo: () => set({ redoStack: [] }),
  setSelectedTextBoxId: (id) => set({ selectedTextBoxId: id }),
}))
