export function uid(): string {
  return 'id' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function sanitizeKey(s: string): string {
  return s.replace(/[\s/\\'"+]+/g, '_').slice(0, 150)
}
