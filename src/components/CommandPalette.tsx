import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBookmarks, useLocalStorage, useSettings } from '../hooks/useLocalStorage'
import type { UrlAlias, ThemeType } from '../types'
import { Search, Earth } from 'lucide-react'
import { openChromeNewTab } from './ChromeTabButton'

interface Result {
  id: string
  label: string
  sub: string
  url?: string
  action?: () => void
  icon: any // Using any to avoid importing ReactNode while supporting Lucide components
  type: 'alias' | 'bookmark' | 'search' | 'url' | 'recent' | 'command'
}

interface RecentItem {
  label: string
  url: string
  ts: number
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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Slash command data ──

const THEME_LIST: { id: ThemeType; name: string }[] = [
  { id: 'carbon', name: 'Carbon' }, { id: 'paper', name: 'Paper' },
  { id: 'nord', name: 'Nord' }, { id: 'solarized', name: 'Solarized' },
  { id: 'matrix', name: 'Matrix' }, { id: 'dracula', name: 'Dracula' },
  { id: 'monokai', name: 'Monokai' }, { id: 'gruvbox', name: 'Gruvbox' },
  { id: 'tokyo-night', name: 'Tokyo Night' }, { id: 'catppuccin', name: 'Catppuccin' },
  { id: 'one-dark', name: 'One Dark' }, { id: 'rose-pine', name: 'Rosé Pine' },
  { id: 'everforest', name: 'Everforest' },
  { id: 'cyberpunk', name: 'Cyberpunk' }, { id: 'aurora', name: 'Aurora' },
  { id: 'synthwave', name: 'Synthwave' }, { id: 'vaporwave', name: 'Vaporwave' },
  { id: 'retro-terminal', name: 'Retro CRT' }, { id: 'sunset', name: 'Sunset' },
  { id: 'ocean', name: 'Ocean' }, { id: 'midnight', name: 'Midnight' },
]

const FONT_LIST = [
  'JetBrains Mono', 'Geist Mono', 'Space Mono', 'Fira Code',
  'Cascadia Code', 'IBM Plex Mono', 'Intel One Mono', 'Iosevka',
  'Commit Mono', 'Source Code Pro', 'Inconsolata', 'Hack',
]

const SLASH_COMMANDS = [
  { name: 'chrome-tab', desc: 'Open Chrome new tab page', icon: <Earth size={16} />, hint: '' },
  { name: 'theme', desc: 'Change color theme', icon: '◑', hint: '<name>' },
  { name: 'font', desc: 'Change font family', icon: '𝐀', hint: '<name>' },
  { name: 'goal', desc: "Set today's daily goal", icon: '▸', hint: '<text>' },
  { name: 'note', desc: 'Append text to scratchpad', icon: '✎', hint: '<text>' },
  { name: 'clock', desc: 'Set clock format', icon: '◷', hint: '12h | 24h' },
  { name: 'export', desc: 'Export settings to JSON', icon: '↓' },
  { name: 'clear', desc: 'Clear recent history', icon: '✕' },
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [engine, setEngine] = useState('google')
  const [toast, setToast] = useState<string | null>(null)
  const { categories } = useBookmarks()
  const [settings, setSettings] = useSettings()
  const [aliases] = useLocalStorage<UrlAlias[]>('neko-aliases', [])
  const [recent, setRecent] = useLocalStorage<RecentItem[]>('neko-recent', [])
  const [, setDailyGoal] = useLocalStorage<{ text: string; date: string } | null>('neko-daily-goal', null)
  const [, setScratchpad] = useLocalStorage<string>('neko-scratchpad', '')
  const inputRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const addRecent = (label: string, url: string) => {
    setRecent(prev => {
      const filtered = prev.filter(r => r.url !== url)
      return [{ label, url, ts: Date.now() }, ...filtered].slice(0, 10)
    })
  }

  // Mirror theme class onto the portaled panel so CSS vars resolve correctly
  const themeClass = useMemo(() => {
    const appEl = document.querySelector<HTMLElement>('.app')
    return appEl
      ? Array.from(appEl.classList).filter(c => c !== 'app' && c !== 'has-bg').join(' ')
      : 'carbon'
  }, [isOpen])

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
        setIsOpen(true); setQuery('/'); setSelected(0)
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

    // ── Slash commands ──
    if (query.startsWith('/')) {
      const raw = query.slice(1)
      const spaceIdx = raw.indexOf(' ')
      const cmdName = spaceIdx === -1 ? raw : raw.slice(0, spaceIdx)
      const args = spaceIdx === -1 ? '' : raw.slice(spaceIdx + 1)
      const hasSpace = spaceIdx !== -1

      if (!hasSpace) {
        // Show matching command suggestions
        for (const cmd of SLASH_COMMANDS) {
          if (fuzzy(cmd.name, cmdName)) {
            const item: Result = {
              id: `cmd-${cmd.name}`,
              label: `/${cmd.name}`,
              sub: cmd.hint ? `${cmd.desc} — ${cmd.hint}` : cmd.desc,
              icon: cmd.icon,
              type: 'command',
            }
            switch (cmd.name) {
             case 'export':
                item.action = () => {
                  import('../utils/backup').then(m => m.exportSettings())
                  showToast('Exporting...')
                }
                break
              case 'clear':
                item.action = () => {
                  setRecent([])
                  showToast('History cleared')
                }
                break
              case 'chrome-tab':
                item.action = () => openChromeNewTab()
                break
            }
            out.push(item)
          }
        }
        return out
      }

      // Command with arguments
      switch (cmdName) {
        case 'theme':
          for (const t of THEME_LIST) {
            if (!args || fuzzy(t.name, args) || fuzzy(t.id, args)) {
              out.push({
                id: `cmd-theme-${t.id}`,
                label: t.name,
                sub: settings.theme === t.id ? '● current' : 'apply theme',
                icon: '◑',
                type: 'command',
                action: () => {
                  setSettings(prev => ({ ...prev, theme: t.id }))
                  showToast(`Theme → ${t.name}`)
                },
              })
            }
          }
          break

        case 'font':
          for (const f of FONT_LIST) {
            if (!args || fuzzy(f, args)) {
              out.push({
                id: `cmd-font-${f}`,
                label: f,
                sub: settings.font === f ? '● current' : 'apply font',
                icon: '𝐀',
                type: 'command',
                action: () => {
                  setSettings(prev => ({ ...prev, font: f }))
                  showToast(`Font → ${f}`)
                },
              })
            }
          }
          break

        case 'goal':
          if (args.trim()) {
            out.push({
              id: 'cmd-goal-set',
              label: args.trim().slice(0, 120),
              sub: "set as today's goal",
              icon: '▸',
              type: 'command',
              action: () => {
                setDailyGoal({ text: args.trim().slice(0, 120), date: todayKey() })
                showToast('Goal set')
              },
            })
          } else {
            out.push({
              id: 'cmd-goal-hint',
              label: '/goal <text>',
              sub: 'type your goal after the command',
              icon: '▸',
              type: 'command',
            })
          }
          break

        case 'note':
          if (args.trim()) {
            out.push({
              id: 'cmd-note-append',
              label: args.trim(),
              sub: 'append to scratchpad',
              icon: '✎',
              type: 'command',
              action: () => {
                setScratchpad(prev => prev ? prev + '\n' + args.trim() : args.trim())
                showToast('Added to scratchpad')
              },
            })
          } else {
            out.push({
              id: 'cmd-note-hint',
              label: '/note <text>',
              sub: 'type your note after the command',
              icon: '✎',
              type: 'command',
            })
          }
          break

        case 'clock': {
          const formats: { value: '12h' | '24h'; label: string }[] = [
            { value: '12h', label: '12-Hour' },
            { value: '24h', label: '24-Hour' },
          ]
          for (const f of formats) {
            if (!args || fuzzy(f.value, args) || fuzzy(f.label, args)) {
              out.push({
                id: `cmd-clock-${f.value}`,
                label: f.label,
                sub: settings.clockFormat === f.value ? '● current' : 'switch format',
                icon: '◷',
                type: 'command',
                action: () => {
                  setSettings(prev => ({ ...prev, clockFormat: f.value }))
                  showToast(`Clock → ${f.label}`)
                },
              })
            }
          }
          break
        }

        case 'export':
          out.push({
            id: 'cmd-export-run',
            label: 'Export to JSON',
            sub: 'download settings backup',
            icon: '↓',
            type: 'command',
            action: () => {
              import('../utils/backup').then(m => m.exportSettings())
              showToast('Exporting...')
            },
          })
          break

        case 'clear':
          if (!args || fuzzy('recent', args)) {
            out.push({
              id: 'cmd-clear-recent',
              label: 'Clear recent history',
              sub: `${recent.length} items`,
              icon: '✕',
              type: 'command',
              action: () => {
                setRecent([])
                showToast('History cleared')
              },
            })
          }
          break
        case 'chrome-tab':
          out.push({
            id: 'cmd-chrome-tab-run',
            label: 'Open Chrome Tab',
            sub: 'Navigate to chrome://new-tab-page',
            icon: <Earth size={16} />,
            type: 'command',
            action: () => openChromeNewTab()
          })
          break
      }
      return out
    }

    // ── Normal search (existing logic) ──

    // When empty — show recent first
    if (!query.trim()) {
      for (const r of recent) {
        out.push({ id: `recent-${r.url}`, label: r.label, sub: r.url, url: r.url, icon: '↺', type: 'recent' })
      }
      return out
    }

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
  }, [query, categories, aliases, engine, settings.theme, settings.font, settings.clockFormat, recent, showToast, setSettings, setRecent, setDailyGoal, setScratchpad])

  useEffect(() => { setSelected(0) }, [query])

  const launch = (r: Result) => {
    // Command suggestion without action — autocomplete it
    if (r.type === 'command' && !r.action) {
      if (r.id.endsWith('-hint')) return
      setQuery(r.label + ' ')
      return
    }
    if (r.action) {
      r.action()
    } else if (r.url) {
      addRecent(r.label, r.url)
      window.location.href = r.url
    }
    setIsOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.ctrlKey && e.code === 'KeyN')) { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp'   || (e.ctrlKey && e.code === 'KeyP')) { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    // Tab autocompletes command suggestions
    if (e.key === 'Tab' && results[selected]?.type === 'command' && !results[selected]?.action) {
      e.preventDefault()
      if (results[selected].id.endsWith('-hint')) return
      setQuery(results[selected].label + ' ')
      return
    }
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
          <div className={`cp-panel ${themeClass}`} onClick={e => e.stopPropagation()}>
            <div className="cp-input-row">
              <Search size={14} className="cp-search-icon" />
              <input
                ref={inputRef}
                className="cp-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="search, go to URL, or type / for commands..."
                spellCheck={false}
              />
              {!query.startsWith('/') && (
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
              )}
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
                    <span className="cp-item-enter">
                      {r.type === 'command' && !r.action ? '→' : '↵'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!query && (
              <div className="cp-hint-row">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>/commands</span>
                {recent.length > 0
                  ? <button className="cp-clear-btn" onClick={e => { e.stopPropagation(); setRecent([]) }}>clear history</button>
                  : <span>esc close</span>
                }
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Toast feedback for slash commands */}
      {toast && createPortal(
        <div className="cp-toast">{toast}</div>,
        document.body
      )}
    </>
  )
}
