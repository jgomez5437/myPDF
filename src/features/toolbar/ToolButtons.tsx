import { useToolStore } from '../../store/toolStore'
import { useUiStore } from '../../store/uiStore'
import type { Tool } from '../../types'

const TOOLS: { key: Tool; label: string }[] = [
  { key: 'select', label: 'Select' },
  { key: 'pen', label: 'Pen' },
  { key: 'highlighter', label: 'Highlighter' },
  { key: 'eraser', label: 'Eraser' },
  { key: 'text', label: 'Text' },
]

export function ToolButtons() {
  const { currentTool, setTool } = useToolStore()
  const hasDocument = useUiStore((s) => s.hasDocument)

  return (
    <div className="flex items-center gap-2">
      {TOOLS.map(({ key, label }) => (
        <button
          key={key}
          disabled={!hasDocument}
          onClick={() => setTool(key)}
          className={`
            font-sans text-[13px] font-semibold border border-transparent rounded-lg px-3.5 py-2 cursor-pointer
            transition-all duration-150
            disabled:opacity-35 disabled:cursor-not-allowed
            ${
              currentTool === key
                ? 'bg-warm text-ink'
                : 'text-[#c9cad2] bg-transparent hover:bg-panel-alt hover:text-white'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
