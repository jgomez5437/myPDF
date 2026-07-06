import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

interface Props {
  onNavigate: (page: number) => void
}

export function PageNav({ onNavigate }: Props) {
  const { currentPage, numPages } = useAppStore()
  const hasDocument = useUiStore((s) => s.hasDocument)

  const btnClass = `
    font-sans text-[13.5px] font-semibold border-none rounded-lg px-3 py-1.5 cursor-pointer
    bg-panel-alt text-white hover:bg-[#34353f]
    disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150
  `

  return (
    <div className="flex items-center gap-2.5 text-[#c9cad2] text-[13px] ml-auto">
      <button
        className={btnClass}
        disabled={!hasDocument || currentPage <= 1}
        onClick={() => onNavigate(currentPage - 1)}
      >
        Prev
      </button>
      <span>{hasDocument ? `Page ${currentPage} of ${numPages}` : 'No pages'}</span>
      <button
        className={btnClass}
        disabled={!hasDocument || currentPage >= numPages}
        onClick={() => onNavigate(currentPage + 1)}
      >
        Next
      </button>
    </div>
  )
}
