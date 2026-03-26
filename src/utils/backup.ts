const BACKUP_PREFIXES = ['neko-', 'startpage-', 'activity_data', 'pomodoro-', 'blocked-', 'custom-']

/**
 * Export all relevant localStorage keys as a JSON file
 * Performance: O(N) single-pass iteration.
 */
export function exportSettings() {
  const backup: Record<string, string | null> = {}
  
  // Use Object.keys for a more modern, stable iteration than index-based loop
  Object.keys(localStorage).forEach(key => {
    if (BACKUP_PREFIXES.some(p => key.startsWith(p))) {
      backup[key] = localStorage.getItem(key)
    }
  })

  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `neko-tab-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  
  // Clean up
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Import settings from a JSON string and reload the page
 * Performance: Single-pass cleanup and insertion.
 */
export function importSettings(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    if (typeof data !== 'object' || data === null) return false

    // Single-pass removal of managed keys
    Object.keys(localStorage).forEach(key => {
      if (BACKUP_PREFIXES.some(p => key.startsWith(p))) {
        localStorage.removeItem(key)
      }
    })

    // Atomic insertion
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        localStorage.setItem(key, value)
      }
    })

    window.location.reload()
    return true
  } catch (e) {
    console.error('Failed to import settings:', e)
    return false
  }
}
