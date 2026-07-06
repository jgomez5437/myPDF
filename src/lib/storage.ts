export let hasStorage = true

try {
  const testKey = '__mypdf_test__'
  localStorage.setItem(testKey, '1')
  localStorage.removeItem(testKey)
} catch {
  hasStorage = false
}

export function safeGet<T>(key: string): T | null {
  if (!hasStorage) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function safeSet(key: string, value: unknown): boolean {
  if (!hasStorage) return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
