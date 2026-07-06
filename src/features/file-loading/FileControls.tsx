import { useRef } from 'react'
import { useAppStore } from '../../store/appStore'

interface Props {
  onFile: (file: File) => void
}

export function FileControls({ onFile }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileName = useAppStore((s) => s.fileName)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <button
        className="text-[13.5px] font-semibold border-none rounded-lg px-4 py-2 cursor-pointer
                   bg-workspace text-ink hover:bg-[#d6d9de] active:translate-y-px transition-all duration-150"
        onClick={() => fileInputRef.current?.click()}
      >
        Open PDF
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleChange}
      />
      <span className="text-[13px] text-[var(--text-muted)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
        {fileName || 'No file loaded'}
      </span>
    </div>
  )
}
