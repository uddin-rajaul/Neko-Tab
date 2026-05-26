import { useState, useEffect, useCallback, useRef } from 'react'
import type { TabItem } from '../types'

export function useOpenTabs() {
  const [tabs, setTabs] = useState<TabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchTabs = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setError('Chrome tabs API not available')
      setLoading(false)
      return
    }

    try {
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

      setTabs(allTabs)
      setError(null)
    } catch (err) {
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
    if (typeof chrome === 'undefined' || !chrome.tabs) return

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
