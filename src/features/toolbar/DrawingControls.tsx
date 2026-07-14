import { useToolStore } from '../../store/toolStore'
import { useHistoryStore } from '../../store/historyStore'
import { useAppStore } from '../../store/appStore'
import { scheduleAutosave } from '../autosave/autosaveManager'
import { pushHistory } from '../history/historyManager'

let colorSessionStarted = false
let sizeSessionStarted = false

export function DrawingControls() {
  const tool = useToolStore((s) => s.currentTool)
  const {
    penColor, highlighterColor, textDefaultColor,
    currentWidth, highlighterWidth, eraserSize, currentFontSize,
    setPenColor, setHighlighterColor, setTextDefaultColor,
    setCurrentWidth, setHighlighterWidth, setEraserSize, setCurrentFontSize,
  } = useToolStore()
  const selectedTextBoxId = useHistoryStore((s) => s.selectedTextBoxId)

  const showColor = tool === 'pen' || tool === 'highlighter' || tool === 'text' ||
    (tool === 'select' && !!selectedTextBoxId)
  const showSize = tool === 'pen' || tool === 'highlighter' || tool === 'eraser' ||
    tool === 'text' || (tool === 'select' && !!selectedTextBoxId)

  let sizeLabel = 'Size'
  let sizeMin = 1
  let sizeMax = 30
  let sizeVal = currentWidth
  let colorVal = penColor

  if (tool === 'highlighter') {
    sizeLabel = 'Highlighter width'; sizeMin = 6; sizeMax = 40; sizeVal = highlighterWidth; colorVal = highlighterColor
  } else if (tool === 'eraser') {
    sizeLabel = 'Eraser size'; sizeMin = 10; sizeMax = 80; sizeVal = eraserSize
  } else if (tool === 'text') {
    sizeLabel = 'Font size'; sizeMin = 10; sizeMax = 56; sizeVal = currentFontSize; colorVal = textDefaultColor
  } else if (tool === 'select' && selectedTextBoxId) {
    sizeLabel = 'Font size'; sizeMin = 10; sizeMax = 56
    const tb = useAppStore.getState().getCurrentPageData().textBoxes.find((t) => t.id === selectedTextBoxId)
    if (tb) { sizeVal = tb.fontSize; colorVal = tb.color }
  }

  function handleColorChange(v: string) {
    if (tool === 'pen') setPenColor(v)
    else if (tool === 'highlighter') setHighlighterColor(v)
    else if (tool === 'text') setTextDefaultColor(v)
    else if (tool === 'select' && selectedTextBoxId) {
      if (!colorSessionStarted) { pushHistory(); colorSessionStarted = true }
      const appStore = useAppStore.getState()
      const pd = appStore.getCurrentPageData()
      const tb = pd.textBoxes.find((t) => t.id === selectedTextBoxId)
      if (tb) {
        tb.color = v
        appStore.updatePage(appStore.currentPage, { ...pd })
        // Remember as the default so the next new text box uses it too.
        setTextDefaultColor(v)
      }
    }
  }

  function handleColorCommit() {
    if (colorSessionStarted) { scheduleAutosave(); colorSessionStarted = false }
  }

  function handleSizeChange(v: number) {
    if (tool === 'pen') setCurrentWidth(v)
    else if (tool === 'highlighter') setHighlighterWidth(v)
    else if (tool === 'eraser') setEraserSize(v)
    else if (tool === 'text') setCurrentFontSize(v)
    else if (tool === 'select' && selectedTextBoxId) {
      if (!sizeSessionStarted) { pushHistory(); sizeSessionStarted = true }
      const appStore = useAppStore.getState()
      const pd = appStore.getCurrentPageData()
      const tb = pd.textBoxes.find((t) => t.id === selectedTextBoxId)
      if (tb) {
        tb.fontSize = v
        appStore.updatePage(appStore.currentPage, { ...pd })
        // Remember as the default so the next new text box uses it too.
        setCurrentFontSize(v)
      }
    }
  }

  function handleSizeCommit() {
    if (sizeSessionStarted) { scheduleAutosave(); sizeSessionStarted = false }
  }

  if (!showColor && !showSize) return null

  return (
    <div className="flex items-center gap-2">
      {showColor && (
        <label className="flex items-center gap-1.5 text-[12.5px] text-[#c9cad2] font-medium">
          Color
          <input
            type="color"
            value={colorVal}
            onChange={(e) => handleColorChange(e.target.value)}
            onBlur={handleColorCommit}
            className="w-7 h-7 border-2 border-[var(--panel-line)] rounded-lg p-0 bg-none cursor-pointer
                       [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded"
          />
        </label>
      )}
      {showSize && (
        <label className="flex items-center gap-1.5 text-[12.5px] text-[#c9cad2] font-medium">
          {sizeLabel}
          <input
            type="range"
            min={sizeMin}
            max={sizeMax}
            value={sizeVal}
            onChange={(e) => handleSizeChange(Number(e.target.value))}
            onMouseUp={handleSizeCommit}
            onTouchEnd={handleSizeCommit}
            className="w-[90px] accent-warm"
          />
          <span className="w-[22px] text-white tabular-nums">{sizeVal}</span>
        </label>
      )}
    </div>
  )
}
