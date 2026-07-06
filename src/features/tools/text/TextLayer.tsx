import { useAppStore } from '../../../store/appStore'
import { useHistoryStore } from '../../../store/historyStore'
import { TextBox } from './TextBox'

interface Props {
  pageStackEl: HTMLElement | null
  autoFocusId: string | null
}

export function TextLayer({ pageStackEl, autoFocusId }: Props) {
  const currentPage = useAppStore((s) => s.currentPage)
  const pages = useAppStore((s) => s.pages)
  const textBoxes = pages[currentPage]?.textBoxes ?? []
  const selectedId = useHistoryStore((s) => s.selectedTextBoxId)
  const setSelectedId = useHistoryStore((s) => s.setSelectedTextBoxId)

  function handleLayerPointerDown(e: React.PointerEvent) {
    if (e.target === e.currentTarget && selectedId) {
      setSelectedId(null)
    }
  }

  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
      onPointerDown={handleLayerPointerDown}
    >
      {textBoxes.map((tb) => (
        <div key={tb.id} style={{ pointerEvents: 'auto' }}>
          <TextBox
            textBox={tb}
            pageStackEl={pageStackEl}
            autoFocus={tb.id === autoFocusId}
          />
        </div>
      ))}
    </div>
  )
}
