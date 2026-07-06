export interface Point {
  x: number
  y: number
}

export interface Stroke {
  id: string
  color: string
  width: number
  opacity: number
  cap: 'round' | 'butt'
  points: Point[]
}

export interface TextBox {
  id: string
  x: number
  y: number
  width: number
  text: string
  color: string
  fontSize: number
}

export interface PageData {
  strokes: Stroke[]
  textBoxes: TextBox[]
}

export type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'text'
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export const RENDER_SCALE = 2.5 as const
export const ZOOM_MIN = 0.3 as const
export const ZOOM_MAX = 5 as const
export const ZOOM_STEP = 1.25 as const
export const STORAGE_PREFIX = 'mypdf_' as const
