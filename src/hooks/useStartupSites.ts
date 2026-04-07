import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { StartupSite } from '../types'

const SITES_KEY   = 'neko_startup_sites'
const SHOWN_KEY   = 'neko_startup_shown'
const ENABLED_KEY = 'neko_startup_enabled'

function todayString(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function useStartupSites() {
  const [sites, setSites]     = useLocalStorage<StartupSite[]>(SITES_KEY, [])
  const [shownDate, setShownDate] = useLocalStorage<string>(SHOWN_KEY, '')
  const [enabled, setEnabled] = useLocalStorage<boolean>(ENABLED_KEY, false)
  const [forceShow, setForceShow] = useState(false)

  const alreadyShownToday = shownDate === todayString()
  const shouldShow = enabled && sites.length > 0 && (!alreadyShownToday || forceShow)

  const markShown = useCallback(() => {
    setShownDate(todayString())
    setForceShow(false)
  }, [setShownDate])

  const openStartupSites = useCallback(async () => {
    if (sites.length === 0) return
    markShown()

    const existingTabs = await chrome.tabs.query({ currentWindow: true })

    for (const site of sites) {
      const siteHostname = new URL(site.url).hostname
      const alreadyOpen = existingTabs.find(t => {
        try {
          return new URL(t.url ?? '').hostname === siteHostname
        } catch {
          return false
        }
      })
      if (alreadyOpen?.id != null) {
        await chrome.tabs.update(alreadyOpen.id, { active: true })
      } else {
        await chrome.tabs.create({ url: site.url, active: false })
      }
    }
  }, [sites, markShown])

  // Mirror to chrome.storage.local so the background service worker can read it
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      void chrome.storage.local.set({ neko_startup_sites: sites })
    }
  }, [sites])

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      void chrome.storage.local.set({ neko_startup_enabled: enabled })
    }
  }, [enabled])

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      void chrome.storage.local.set({ neko_startup_shown: shownDate })
    }
  }, [shownDate])

  return {
    sites,
    setSites,
    enabled,
    setEnabled,
    shouldShow,
    markShown,
    openStartupSites,
    setForceShow,
  }
}
