import { useEffect, useState } from 'react'
import { getTabUsageStorageKey, readTabUsageCount } from '../utils/tabUsage'

export function TabCounter() {
  const [tabCount, setTabCount] = useState(0)

  useEffect(() => {
    const syncCount = async () => {
      setTabCount(await readTabUsageCount())
    }

    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local' || !changes[getTabUsageStorageKey()]) return
      setTabCount(Number(changes[getTabUsageStorageKey()].newValue ?? 0))
    }

    const handleStorageSync = (event: StorageEvent) => {
      if (event.key !== getTabUsageStorageKey()) return
      void syncCount()
    }

    void syncCount()

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.onChanged.addListener(handleStorageChange)
    } else {
      window.addEventListener('storage', handleStorageSync)
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.onChanged.removeListener(handleStorageChange)
      } else {
        window.removeEventListener('storage', handleStorageSync)
      }
    }
  }, [])

  return (
    <div className="stat-item" title={`${tabCount} tabs turned into real navigation today in this browser session`}>
      <span className="stat-label">TABS TODAY</span>
      <span className="stat-value">{tabCount}</span>
    </div>
  )
}
