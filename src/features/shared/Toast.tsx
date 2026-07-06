import { useEffect } from 'react'
import { useUiStore } from '../../store/uiStore'

let toastTimer: ReturnType<typeof setTimeout> | null = null

export function Toast() {
  const { toastMessage, toastVisible, hideToast } = useUiStore()

  useEffect(() => {
    if (toastVisible) {
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => hideToast(), 3200)
    }
  }, [toastVisible, toastMessage, hideToast])

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        bg-ink/90 text-white text-sm font-medium
        px-4 py-2.5 rounded-lg shadow-lg
        transition-all duration-200
        ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}
    >
      {toastMessage}
    </div>
  )
}
