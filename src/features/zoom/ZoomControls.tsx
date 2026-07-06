import { useUiStore } from '../../store/uiStore'

interface Props {
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}

export function ZoomControls({ onZoomIn, onZoomOut, onFit }: Props) {
  const { displayScale, hasDocument } = useUiStore()

  const btnClass = `
    bg-panel-alt text-white border-none rounded-lg px-3 py-2 text-[13px] font-semibold cursor-pointer
    hover:bg-[#34353f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150
  `

  return (
    <div className="flex items-center gap-2">
      <button className={btnClass} title="Zoom out (Ctrl+-)" disabled={!hasDocument} onClick={onZoomOut}>
        −
      </button>
      <span className="text-[#c9cad2] text-[12.5px] tabular-nums min-w-[36px] text-center">
        {Math.round(displayScale * 100)}%
      </span>
      <button className={btnClass} title="Zoom in (Ctrl++)" disabled={!hasDocument} onClick={onZoomIn}>
        +
      </button>
      <button className={btnClass} title="Fit to width (Ctrl+0)" disabled={!hasDocument} onClick={onFit}>
        Fit
      </button>
    </div>
  )
}
