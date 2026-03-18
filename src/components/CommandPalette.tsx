import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useBookmarks, useLocalStorage } from '../hooks/useLocalStorage'
import type { UrlAlias } from '../types'
import { Search } from 'lucide-react'

interface Result {
  id: string
  label: string
  sub: string
  url?: string
  icon: string
  type: 'alias' | 'bookmark' | 'search' | 'url'
}

const SEARCH_ENGINES: Record<string, { name: string; url: string }> = {
  google:     { name: 'Google',     url: 'https://www.google.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  github:     { name: 'GitHub',     url: 'https://github.com/search?q=' },
  youtube:    { name: 'YouTube',    url: 'https://www.youtube.com/results?search_query=' },
}

function fuzzy(str: string, query: string): boolean {
  if (!query) return true
  const s = str.toLowerCase()
  const q = query.toLowerCase()
  let si = 0
  for (let qi = 0; qi < q.length; qi++) {
    while (si < s.length && s[si] !== q[qi]) si++
    if (si >= s.length) return false
    si++
  }
  return true
}

function isUrl(str: string): boolean {
  return /^https?:\/\//i.test(str) || /^[\w-]+\.\w{2,}(\/.*)?$/.test(str)
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [engine, setEngine] = useState('google')
  const { categories } = useBookmarks()
  const [aliases] = useLocalStorage<UrlAlias[]>('neko-aliases', [])
  const inputRef = useRef<HTMLInputElement>(null)

  // Mirror theme class onto the portaled panel so CSS vars resolve correctly
  const appEl = document.querySelector<HTMLElement>('.app')
  const themeClass = appEl
    ? Array.from(appEl.classList).filter(c => c !== 'app' && c !== 'has-bg').join(' ')
    : ''

  // Open/close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(o => !o)
        if (!isOpen) { setQuery(''); setSelected(0) }
      }
      // '/' key opens if not in input
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        setIsOpen(true); setQuery(''); setSelected(0)
      }
      if (e.key === 'Escape') { setIsOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 30)
  }, [isOpen])

  const results = useMemo<Result[]>(() => {
    const out: Result[] = []

    // Exact URL typed
    if (isUrl(query)) {
      const href = /^https?:\/\//i.test(query) ? query : 'https://' + query
      out.push({ id: '__url__', label: query, sub: 'Go to URL', url: href, icon: '↗', type: 'url' })
    }

    // Aliases
    for (const a of aliases) {
      if (fuzzy(a.key, query) || fuzzy(a.url, query)) {
        out.push({ id: `alias-${a.key}`, label: a.key, sub: a.url, url: a.url, icon: '→', type: 'alias' })
      }
    }

    // Bookmarks
    for (const cat of categories) {
      for (const bm of cat.bookmarks) {
        if (fuzzy(bm.title, query) || fuzzy(bm.url, query) || fuzzy(cat.name, query)) {
          out.push({ id: bm.id, label: bm.title, sub: `${cat.name} · ${bm.url}`, url: bm.url, icon: '⬡', type: 'bookmark' })
        }
      }
    }

    // Web search fallback — always show when there's a query
    if (query.trim() && !isUrl(query)) {
      out.push({
        id: '__search__',
        label: `Search "${query}"`,
        sub: `${SEARCH_ENGINES[engine].name}`,
        url: SEARCH_ENGINES[engine].url + encodeURIComponent(query),
        icon: '⌕',
        type: 'search',
      })
    }

    return out
  }, [query, categories, aliases, engine])

  useEffect(() => { setSelected(0) }, [query])

  const launch = (r: Result) => {
    if (r.url) window.location.href = r.url
    setIsOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selected]) {
        launch(results[selected])
      } else if (query.trim()) {
        // fallback: web search
        window.location.href = SEARCH_ENGINES[engine].url + encodeURIComponent(query)
        setIsOpen(false); setQuery('')
      }
    }
  }

  return (
    <>
      {/* Trigger bar — sits inline where SearchBar used to be */}
      <div className="cp-trigger" onClick={() => { setIsOpen(true); setQuery(''); setSelected(0) }}>
        <Search size={14} className="cp-trigger-icon" />
        <span className="cp-trigger-text">search, navigate, or jump...</span>
        <span className="cp-trigger-hint">
          <kbd>⌘K</kbd>
          <span className="cp-trigger-sep">/</span>
          <kbd>/</kbd>
        </span>
      </div>

      {/* Palette overlay — portaled to body so it escapes any layout constraints */}
      {isOpen && createPortal(
        <div className="cp-overlay" onClick={() => setIsOpen(false)}>
          <div className={`cp-panel app ${themeClass}`} onClick={e => e.stopPropagation()}>
            <div className="cp-input-row">
              <Search size={14} className="cp-search-icon" />
              <input
                ref={inputRef}
                className="cp-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="search, go to URL, or type to search web..."
                spellCheck={false}
              />
              <div className="cp-engines">
                {Object.entries(SEARCH_ENGINES).map(([key, val]) => (
                  <button
                    key={key}
                    className={`cp-engine-btn ${engine === key ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); setEngine(key) }}
                    title={val.name}
                  >
                    {key.slice(0, 2)}
                  </button>
                ))}
              </div>
              <span className="cp-esc">esc</span>
            </div>

            {results.length > 0 && (
              <div className="cp-results">
                {results.map((r, i) => (
                  <div
                    key={r.id}
                    className={`cp-item cp-item-${r.type} ${i === selected ? 'active' : ''}`}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => launch(r)}
                  >
                    <span className="cp-item-icon">{r.icon}</span>
                    <div className="cp-item-text">
                      <span className="cp-item-label">{r.label}</span>
                      <span className="cp-item-sub">{r.sub}</span>
                    </div>
                    <span className="cp-item-enter">↵</span>
                  </div>
                ))}
              </div>
            )}

            {!query && (
              <div className="cp-hint-row">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
