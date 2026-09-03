import { useState, useEffect, useCallback, useRef } from 'react'
import type { TabItem } from '../types'

function isContentScript(): boolean {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) return false
  // Content scripts can't access chrome.windows directly
  try {
    return typeof chrome.windows === 'undefined'
  } catch {
    return true
  }
}

async function fetchTabsDirect(): Promise<TabItem[]> {
  const allTabs: TabItem[] = []
  const windows = await chrome.windows.getAll({ populate: true })

  for (const win of windows) {
    if (win.tabs) {
      for (const tab of win.tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          allTabs.push({
            id: tab.id,
            title: tab.title || tab.url,
            url: tab.url,
            favicon: tab.favIconUrl,
            windowId: win.id || 0,
          })
        }
      }
    }
  }
  return allTabs
}

async function fetchTabsViaMessage(): Promise<TabItem[]> {
  const response = await chrome.runtime.sendMessage({ type: 'neko-get-tabs' })
  return response?.tabs ?? []
}

export function useOpenTabs() {
  const [tabs, setTabs] = useState<TabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const contentMode = useRef(isContentScript())

  const fetchTabs = useCallback(async () => {
    if (typeof chrome === 'undefined') {
      setError('Chrome API not available')
      setLoading(false)
      return
    }

    try {
      const result = contentMode.current
        ? await fetchTabsViaMessage()
        : await fetchTabsDirect()
      setTabs(result)
      setError(null)
    } catch (err) {
      // If direct API fails, try message passing as fallback
      if (!contentMode.current) {
        try {
          const result = await fetchTabsViaMessage()
          setTabs(result)
          setError(null)
          return
        } catch {
          // both methods failed
        }
      }
      setError('Failed to fetch tabs')
      console.error('Tab fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs || contentMode.current) return

    const handleChange = () => fetchTabs()
    const handleUpdated = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(fetchTabs, 300)
    }

    chrome.tabs.onCreated.addListener(handleChange)
    chrome.tabs.onRemoved.addListener(handleChange)
    chrome.tabs.onUpdated.addListener(handleUpdated)

    return () => {
      chrome.tabs.onCreated.removeListener(handleChange)
      chrome.tabs.onRemoved.removeListener(handleChange)
      chrome.tabs.onUpdated.removeListener(handleUpdated)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchTabs])

  return { tabs, loading, error, refetch: fetchTabs }
}
