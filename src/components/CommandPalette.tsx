import { useState, useEffect, useRef, useMemo } from 'react'
import { useBookmarks, useLocalStorage } from '../hooks/useLocalStorage'
import type { UrlAlias } from '../types'
import { Search } from 'lucide-react'

interface Result {
  id: string
  label: string
  sub: string
  url?: string
  action?: () => void
  icon: string
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

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const { categories } = useBookmarks()
  const [aliases] = useLocalStorage<UrlAlias[]>('neko-aliases', [])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(o => !o)
        setQuery('')
        setSelected(0)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 30)
  }, [isOpen])

  const results = useMemo<Result[]>(() => {
    const out: Result[] = []
    // Aliases first
    for (const a of aliases) {
      if (fuzzy(a.key, query) || fuzzy(a.url, query)) {
        out.push({ id: `alias-${a.key}`, label: a.key, sub: a.url, url: a.url, icon: '→' })
      }
    }
    // Bookmarks
    for (const cat of categories) {
      for (const bm of cat.bookmarks) {
        if (fuzzy(bm.title, query) || fuzzy(bm.url, query) || fuzzy(cat.name, query)) {
          out.push({ id: bm.id, label: bm.title, sub: cat.name + ' · ' + bm.url, url: bm.url, icon: '⬡' })
        }
      }
    }
    return out
  }, [query, categories, aliases])

  useEffect(() => { setSelected(0) }, [query])

  const launch = (r: Result) => {
    if (r.url) window.location.href = r.url
    if (r.action) r.action()
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) launch(results[selected])
  }

  if (!isOpen) return null

  return (
    <div className="cp-overlay" onClick={() => setIsOpen(false)}>
      <div className="cp-panel" onClick={e => e.stopPropagation()}>
        <div className="cp-input-row">
          <Search size={14} className="cp-search-icon" />
          <input
            ref={inputRef}
            className="cp-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="search bookmarks, aliases..."
            spellCheck={false}
          />
          <span className="cp-esc">esc</span>
        </div>
        {results.length > 0 && (
          <div className="cp-results">
            {results.map((r, i) => (
              <div
                key={r.id}
                className={`cp-item ${i === selected ? 'active' : ''}`}
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
        {results.length === 0 && query && (
          <div className="cp-empty">no results for "{query}"</div>
        )}
      </div>
    </div>
  )
}
