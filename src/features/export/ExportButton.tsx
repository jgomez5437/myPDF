import { useState } from 'react'
import { exportPdf } from './pdfExporter'
import { useUiStore } from '../../store/uiStore'

export function ExportButton() {
  const hasDocument = useUiStore((s) => s.hasDocument)
  const [exporting, setExporting] = useState(false)

  async function handleClick() {
    setExporting(true)
    await exportPdf()
    setExporting(false)
  }

  return (
    <button
      disabled={!hasDocument || exporting}
      onClick={handleClick}
      className="text-[13.5px] font-semibold border-none rounded-lg px-4 py-2 cursor-pointer
                 bg-accent text-white hover:bg-[var(--accent-strong)]
                 disabled:opacity-40 disabled:cursor-not-allowed
                 active:translate-y-px transition-all duration-150"
    >
      {exporting ? 'Preparing…' : 'Save and download'}
    </button>
  )
}
