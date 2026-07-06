import { useRef, useLayoutEffect, useEffect, useState } from 'react'
import type { TextBox as TextBoxData } from '../../../types'
import { useAppStore } from '../../../store/appStore'
import { useHistoryStore } from '../../../store/historyStore'
import { useToolStore } from '../../../store/toolStore'
import { scheduleAutosave } from '../../autosave/autosaveManager'
import { pushHistory } from '../../history/historyManager'
import { getDocCoords } from '../pen/penTool'

interface Props {
  textBox: TextBoxData
  pageStackEl: HTMLElement | null
  autoFocus?: boolean
}

type DragState = {
  tbId: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  moved: boolean
  historyPushed: boolean
  pageStackEl: HTMLElement
}

let dragState: DragState | null = null

export function TextBox({ textBox: tb, pageStackEl, autoFocus }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  // Per-instance flag — module-level would be shared across all boxes
  const editSessionRef = useRef(false)

  const selectedId = useHistoryStore((s) => s.selectedTextBoxId)
  const setSelectedId = useHistoryStore((s) => s.setSelectedTextBoxId)
  const currentTool = useToolStore((s) => s.currentTool)
  const isSelected = selectedId === tb.id

  // Sync text to DOM only when NOT editing.
  // useLayoutEffect runs before paint — avoids a flash of empty content.
  // This also handles undo/redo updating tb.text while the box isn't focused.
  useLayoutEffect(() => {
    if (!isEditing && contentRef.current) {
      contentRef.current.innerText = tb.text
    }
  }, [tb.text, isEditing])

  // Auto-focus on newly created text boxes
  useEffect(() => {
    if (autoFocus) enterEditMode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  function enterEditMode() {
    setIsEditing(true)
    // Focus after React has applied contentEditable="true" to the DOM
    setTimeout(() => {
      const el = contentRef.current
      if (!el) return
      el.focus()
      if (window.getSelection && document.createRange) {
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
      }
    }, 0)
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (currentTool !== 'select') return
    e.stopPropagation()
    setSelectedId(tb.id)
    // Don't start a drag while editing — let the browser handle text selection
    if (isEditing) return
    if (!pageStackEl) return

    const startDoc = getDocCoords(e.nativeEvent, pageStackEl)
    dragState = {
      tbId: tb.id,
      startX: tb.x,
      startY: tb.y,
      offsetX: startDoc.x - tb.x,
      offsetY: startDoc.y - tb.y,
      moved: false,
      historyPushed: false,
      pageStackEl,
    }
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd)
  }

  function handleDblClick(e: React.MouseEvent) {
    e.stopPropagation()
    enterEditMode()
  }

  function handleFocus() {
    if (!editSessionRef.current) {
      pushHistory()
      editSessionRef.current = true
    }
  }

  function handleInput() {
    if (!contentRef.current) return
    const text = contentRef.current.innerText
    const appStore = useAppStore.getState()
    const pd = appStore.getCurrentPageData()
    appStore.updatePage(appStore.currentPage, {
      ...pd,
      textBoxes: pd.textBoxes.map((t) => (t.id === tb.id ? { ...t, text } : t)),
    })
  }

  function handleBlur() {
    setIsEditing(false)
    editSessionRef.current = false
    scheduleAutosave()
  }

  function handleDeletePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    pushHistory()
    const appStore = useAppStore.getState()
    const pd = appStore.getCurrentPageData()
    appStore.updatePage(appStore.currentPage, {
      ...pd,
      textBoxes: pd.textBoxes.filter((t) => t.id !== tb.id),
    })
    if (selectedId === tb.id) setSelectedId(null)
    scheduleAutosave()
  }

  return (
    <div
      className={`absolute select-none group
        ${isEditing ? 'cursor-text' : 'cursor-move'}
        ${isSelected ? 'outline outline-2 outline-accent bg-accent/5 rounded' : ''}
      `}
      style={{ left: tb.x, top: tb.y, width: tb.width, color: tb.color, fontSize: tb.fontSize }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDblClick}
    >
      {/*
        No children here — content is managed imperatively via useLayoutEffect + innerText.
        This prevents React from overwriting the live DOM during typing or after re-renders.
        contentEditable is controlled by isEditing state so React applies it correctly
        on every render rather than us fighting it with imperative setAttribute calls.
      */}
      <div
        ref={contentRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        spellCheck={false}
        onFocus={handleFocus}
        onInput={handleInput}
        onBlur={handleBlur}
        className="outline-none min-h-[1.2em] whitespace-pre-wrap break-words"
        style={{ fontFamily: 'inherit' }}
      />
      {isSelected && (
        <button
          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-danger text-white
                     text-xs flex items-center justify-center border-none cursor-pointer leading-none
                     opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete text box"
          onPointerDown={handleDeletePointerDown}
          onClick={handleDeleteClick}
        >
          ×
        </button>
      )}
    </div>
  )
}

function onDragMove(evt: PointerEvent) {
  if (!dragState) return
  const { x, y } = getDocCoords(evt, dragState.pageStackEl)
  if (!dragState.historyPushed) {
    pushHistory()
    dragState.historyPushed = true
  }
  const newX = x - dragState.offsetX
  const newY = y - dragState.offsetY
  dragState.moved = true
  const appStore = useAppStore.getState()
  const pd = appStore.getCurrentPageData()
  appStore.updatePage(appStore.currentPage, {
    ...pd,
    textBoxes: pd.textBoxes.map((t) =>
      t.id === dragState!.tbId ? { ...t, x: newX, y: newY } : t,
    ),
  })
}

function onDragEnd() {
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
  if (dragState?.moved) scheduleAutosave()
  dragState = null
}
