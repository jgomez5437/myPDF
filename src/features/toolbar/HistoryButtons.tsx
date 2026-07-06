import { useHistoryStore } from '../../store/historyStore'
import { useUiStore } from '../../store/uiStore'
import { undo, redo } from '../history/historyManager'
import { useAppStore } from '../../store/appStore'
import { scheduleAutosave } from '../autosave/autosaveManager'
import { pushHistory } from '../history/historyManager'

export function HistoryButtons() {
  const { historyStack, redoStack, selectedTextBoxId, setSelectedTextBoxId } = useHistoryStore()
  const hasDocument = useUiStore((s) => s.hasDocument)

  function handleDelete() {
    if (!selectedTextBoxId) return
    pushHistory()
    const appStore = useAppStore.getState()
    const pd = appStore.getCurrentPageData()
    appStore.updatePage(appStore.currentPage, {
      ...pd,
      textBoxes: pd.textBoxes.filter((t) => t.id !== selectedTextBoxId),
    })
    setSelectedTextBoxId(null)
    scheduleAutosave()
  }

  const btnClass = `
    bg-panel-alt text-white border-none rounded-lg px-3 py-2 text-[13px] font-semibold cursor-pointer
    hover:bg-[#34353f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150
  `

  return (
    <div className="flex items-center gap-2">
      <button
        className={btnClass}
        title="Undo (Ctrl+Z)"
        disabled={!hasDocument || historyStack.length === 0}
        onClick={undo}
      >
        Undo
      </button>
      <button
        className={btnClass}
        title="Redo (Ctrl+Y)"
        disabled={!hasDocument || redoStack.length === 0}
        onClick={redo}
      >
        Redo
      </button>
      <button
        className={`${btnClass} hover:!bg-danger`}
        title="Delete selected text box"
        disabled={!hasDocument || !selectedTextBoxId}
        onClick={handleDelete}
      >
        Delete text
      </button>
    </div>
  )
}
