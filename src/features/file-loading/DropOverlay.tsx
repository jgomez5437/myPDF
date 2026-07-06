import { useEffect, useState } from 'react'
import { useUiStore } from '../../store/uiStore'

interface Props {
  onFile: (file: File) => void
}

function isFileDrag(e: DragEvent): boolean {
  return !!(e.dataTransfer && Array.from(e.dataTransfer.types ?? []).includes('Files'))
}

export function DropOverlay({ onFile }: Props) {
  const [active, setActive] = useState(false)
  const showToast = useUiStore((s) => s.showToast)

  useEffect(() => {
    let dragCounter = 0

    function onDragEnter(e: DragEvent) {
      e.preventDefault()
      if (!isFileDrag(e)) return
      dragCounter++
      setActive(true)
    }
    function onDragOver(e: DragEvent) {
      e.preventDefault()
      if (isFileDrag(e) && e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    function onDragLeave(e: DragEvent) {
      if (!isFileDrag(e)) return
      dragCounter = Math.max(0, dragCounter - 1)
      if (dragCounter === 0) setActive(false)
    }
    function onDrop(e: DragEvent) {
      e.preventDefault()
      dragCounter = 0
      setActive(false)
      if (!isFileDrag(e)) return
      const files = Array.from(e.dataTransfer?.files ?? [])
      const pdfFile = files.find(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      )
      if (pdfFile) onFile(pdfFile)
      else if (files.length) showToast('Please drop a PDF file.')
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [onFile, showToast])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-panel/80 backdrop-blur-sm">
      <div className="border-2 border-dashed border-accent rounded-2xl p-12 text-center">
        <p className="font-display font-bold text-xl text-white m-0 mb-1.5">
          Drop your PDF to open it
        </p>
        <p className="text-[13.5px] text-[#c9cad2] m-0">Release anywhere on the screen</p>
      </div>
    </div>
  )
}
