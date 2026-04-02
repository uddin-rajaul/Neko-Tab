import { useState, useEffect, useCallback } from 'react'
import type { BookmarkCategory, Settings } from '../types'
import { CAT_ASCII } from '../components/ascii'

export const STORAGE_KEYS = {
  SETTINGS: 'startpage-settings',
  BOOKMARKS: 'startpage-bookmarks',
  BG_IMAGE: 'neko-bg-image',
  CALENDAR_CONNECTED: 'neko-calendar-connected',
  CALENDAR_LAST_EVENT: 'neko-calendar-last-event',
} as const;

const DEFAULT_CATEGORIES: BookmarkCategory[] = [
  {
    id: '1',
    name: 'Design',
    bookmarks: [
      { id: '1-1', title: 'Dribbble', url: 'https://dribbble.com' },
      { id: '1-2', title: 'Behance', url: 'https://behance.net' },
      { id: '1-3', title: 'Figma', url: 'https://figma.com' },
    ]
  },
  {
    id: '2',
    name: 'Dev',
    bookmarks: [
      { id: '2-1', title: 'GitHub', url: 'https://github.com' },
      { id: '2-2', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
      { id: '2-3', title: 'MDN', url: 'https://developer.mozilla.org' },
    ]
  },
  {
    id: '3',
    name: 'Socials',
    bookmarks: [
      { id: '3-1', title: 'X', url: 'https://x.com' },
      { id: '3-2', title: 'Reddit', url: 'https://reddit.com' },
      { id: '3-3', title: 'LinkedIn', url: 'https://linkedin.com' },
    ]
  },
  {
    id: '4',
    name: 'Entertainment',
    bookmarks: [
      { id: '4-1', title: 'YouTube', url: 'https://youtube.com' },
      { id: '4-2', title: 'Netflix', url: 'https://netflix.com' },
      { id: '4-3', title: 'Spotify', url: 'https://spotify.com' },
    ]
  },
]

const DEFAULT_SETTINGS: Settings = {
  userName: 'User',
  showGreeting: true,
  showClock: true,
  showWeather: false,
  showStatusBar: true,
  showTabCounter: true,
  theme: 'carbon',
  clockFormat: '24h',
  bgDim: 40,
  bgBlur: 0,
  showDailyGoal: true,
  showGitHubStreak: false,
  githubUsername: '',
  font: 'JetBrains Mono',
  asciiArtSource: 'cat',
  customAsciiArt: CAT_ASCII,
  asciiArt: CAT_ASCII,
  showChromeTab: false,
  showBookmarks: true,
  showGoogleCalendar: false
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      // Use pre-warmed state for settings if available
      if (key === 'startpage-settings' && typeof window !== 'undefined' && (window as any).__NEKO_SETTINGS__) {
        const preWarmed = (window as any).__NEKO_SETTINGS__;
        if (
          typeof preWarmed === 'object' && preWarmed !== null && !Array.isArray(preWarmed) &&
          typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
        ) {
          return { ...defaultValue, ...preWarmed }
        }
        return preWarmed;
      }

      const stored = localStorage.getItem(key)
      if (!stored) return defaultValue
      
      const parsed = JSON.parse(stored)
      // If it's a plain object (not an array), merge with default value to ensure new properties exist
      if (
        typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) &&
        typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
      ) {
        const merged = { ...defaultValue, ...parsed }
        
        // Migration: If user has custom art but no source selection yet, default to 'custom'
        if (key === 'startpage-settings' && parsed.asciiArt && !parsed.asciiArtSource) {
          (merged as any).asciiArtSource = 'custom'
        }
        
        return merged as T
      }
      return parsed
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      window.dispatchEvent(new CustomEvent('neko-storage-sync', { detail: key }))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [key, value])

  // Cross-component sync: when another hook instance writes to the same key,
  // update this instance's state to match
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const raw = localStorage.getItem(key)
        if (raw === null) return
        setValue(prev => JSON.stringify(prev) === raw ? prev : JSON.parse(raw))
      } catch { /* ignore */ }
    }

    const customHandler = (e: Event) => {
      if ((e as CustomEvent).detail !== key) return
      syncFromStorage()
    }

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== key) return
      syncFromStorage()
    }

    window.addEventListener('neko-storage-sync', customHandler)
    window.addEventListener('storage', storageHandler)

    return () => {
      window.removeEventListener('neko-storage-sync', customHandler)
      window.removeEventListener('storage', storageHandler)
    }
  }, [key])

  return [value, setValue]
}

export function useBookmarks() {
  const [categories, setCategories] = useLocalStorage<BookmarkCategory[]>('startpage-bookmarks', DEFAULT_CATEGORIES)

  const addCategory = useCallback((name: string) => {
    setCategories(prev => [...prev, {
      id: crypto.randomUUID(),
      name,
      bookmarks: []
    }])
  }, [setCategories])

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id))
  }, [setCategories])

  const renameCategory = useCallback((id: string, name: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name } : cat
    ))
  }, [setCategories])

  const addBookmark = useCallback((categoryId: string, title: string, url: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, bookmarks: [...cat.bookmarks, { id: crypto.randomUUID(), title, url }] }
        : cat
    ))
  }, [setCategories])

  const deleteBookmark = useCallback((categoryId: string, bookmarkId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, bookmarks: cat.bookmarks.filter(b => b.id !== bookmarkId) }
        : cat
    ))
  }, [setCategories])

  const editBookmark = useCallback((categoryId: string, bookmarkId: string, title: string, url: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, bookmarks: cat.bookmarks.map(b => 
            b.id === bookmarkId ? { ...b, title, url } : b
          )}
        : cat
    ))
  }, [setCategories])

  return {
    categories,
    addCategory,
    deleteCategory,
    renameCategory,
    addBookmark,
    deleteBookmark,
    editBookmark,
  }
}

export function useTime() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return time
}

const FONT_URLS: Record<string, string> = {
  'JetBrains Mono': 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
  'Geist Mono':     'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;700&display=swap',
  'Space Mono':     'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
  'Fira Code':      'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap',
  'Cascadia Code':  'https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400;700&display=swap',
  'IBM Plex Mono':  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap',
  'Intel One Mono': 'https://fonts.googleapis.com/css2?family=Intel+One+Mono:wght@400;700&display=swap',
  'Iosevka':        'https://fonts.googleapis.com/css2?family=Iosevka:wght@400;700&display=swap',
  'Commit Mono':    'https://fonts.googleapis.com/css2?family=Commit+Mono:wght@400;700&display=swap',
  'Source Code Pro':'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&display=swap',
  'Inconsolata':    'https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap',
  'Hack':           'https://cdn.jsdelivr.net/npm/hack-font@3/build/web/hack.css',
}

function loadFont(family: string) {
  const url = FONT_URLS[family]
  if (!url) return
  const id = `font-${family.replace(/\s/g, '-')}`
  if (document.getElementById(id)) return // already loaded
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>('startpage-settings', DEFAULT_SETTINGS)

  // Lazily load only the selected font — not all fonts upfront
  useEffect(() => {
    const font = settings.font || 'JetBrains Mono'
    loadFont(font)
    localStorage.setItem('neko-font', font)
    document.documentElement.style.setProperty('--font-mono', `'${font}'`)
  }, [settings.font])

  return [settings, setSettings] as const
}
