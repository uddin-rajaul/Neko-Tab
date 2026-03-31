function todayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function storageKey() {
  return `neko-tab-count:${todayKey()}`
}

function countedKey() {
  return `neko-tab-used:${todayKey()}`
}

function focusSessionStorageKey(sessionId: string) {
  return `neko-focus-tab-count:${sessionId}`
}

async function getPersistentStorageValue(key: string) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await chrome.storage.local.get(key)
    return Number(result[key] ?? 0)
  }

  return Number(localStorage.getItem(key) ?? 0)
}

async function setPersistentStorageValue(key: string, value: number) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [key]: value })
    return
  }

  localStorage.setItem(key, String(value))
}

export async function readTabUsageCount() {
  return getPersistentStorageValue(storageKey())
}

export async function recordTabUsage() {
  if (sessionStorage.getItem(countedKey())) return

  sessionStorage.setItem(countedKey(), 'true')
  await setPersistentStorageValue(storageKey(), (await readTabUsageCount()) + 1)

  const focusSessionId = getActiveFocusSessionId()
  if (!focusSessionId) return

  const focusKey = focusSessionStorageKey(focusSessionId)
  const currentFocusCount = await getPersistentStorageValue(focusKey)
  await setPersistentStorageValue(focusKey, currentFocusCount + 1)
}

export function getTabUsageStorageKey() {
  return storageKey()
}

export async function readFocusSessionTabUsageCount(sessionId: string | null) {
  if (!sessionId) return 0
  return getPersistentStorageValue(focusSessionStorageKey(sessionId))
}

export async function clearFocusSessionTabUsageCount(sessionId: string | null) {
  if (!sessionId) return

  const key = focusSessionStorageKey(sessionId)
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.remove(key)
    return
  }

  localStorage.removeItem(key)
}

function getActiveFocusSessionId() {
  try {
    const raw = localStorage.getItem('pomodoro-state')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.isRunning ? parsed.sessionId ?? null : null
  } catch {
    return null
  }
}
