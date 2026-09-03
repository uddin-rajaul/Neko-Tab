import { useState, useEffect, useCallback } from 'react'
import type { TabItem } from '../types'

export function useContentTabs() {
  const [tabs, setTabs] = useState<TabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTabs = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      setError('Chrome runtime not available')
      setLoading(false)
      return
    }

    try {
      const response = await chrome.runtime.sendMessage({ type: 'neko-get-tabs' })
      setTabs(response?.tabs ?? [])
      setError(response?.error ?? null)
    } catch (err) {
      setError('Failed to fetch tabs')
      setTabs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])

  return { tabs, loading, error, refetch: fetchTabs }
}
