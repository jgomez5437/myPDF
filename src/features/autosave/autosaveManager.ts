import { STORAGE_PREFIX } from '../../types'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { hasStorage, safeGet, safeSet } from '../../lib/storage'
import type { PageData } from '../../types'

let autosaveTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleAutosave(): void {
  const { docId } = useAppStore.getState()
  if (!docId) return
  if (!hasStorage) {
    useUiStore.getState().setSaveStatus('error', 'Autosave unavailable in this browser')
    return
  }
  useUiStore.getState().setSaveStatus('saving', 'Saving...')
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    const { pages } = useAppStore.getState()
    const ok = safeSet(STORAGE_PREFIX + docId, { pages, savedAt: Date.now() })
    if (ok) {
      useUiStore.getState().setSaveStatus('saved', 'All changes saved')
    } else {
      useUiStore.getState().setSaveStatus('error', 'Autosave failed (storage may be full)')
    }
  }, 600)
}

export function tryRestoreProgress(): void {
  const { docId, setPages, pages } = useAppStore.getState()
  if (!docId || !hasStorage) return
  const saved = safeGet<{ pages: Record<number, PageData> }>(STORAGE_PREFIX + docId)
  if (saved?.pages) {
    setPages(saved.pages)
    useUiStore.getState().showToast('Restored your previous progress on this file.')
  } else {
    useAppStore.getState().setPages(pages)
  }
}
