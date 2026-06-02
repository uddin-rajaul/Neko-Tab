import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBookmarks, useLocalStorage, useSettings } from '../hooks/useLocalStorage'
import type { UrlAlias, ThemeType } from '../types'
import { Search, Earth, Bookmark } from 'lucide-react'
import { openChromeNewTab } from './ChromeTabButton'
import { recordTabUsage } from '../utils/tabUsage'
import { useOpenTabs } from '../hooks/useOpenTabs'
import { useAIProviders } from '../hooks/useAIProviders'
import { useAIMemory } from '../hooks/useAIMemory'
import { executeActions, buildContext, fetchFrequentDestinations, parseDateQuery, fetchHistoryForDateRange } from '../utils/ai-command-parser'
import type { AIAction } from '../types'

interface Result {
  id: string
  label: string
  sub: string
  url?: string
  action?: () => void
  icon: any
  type: 'alias' | 'bookmark' | 'search' | 'url' | 'recent' | 'command' | 'history' | 'calc' | 'tab' | 'ai'
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

function tryCalc(expr: string): string | null {
  try {
    if (!/^[\d\s+\-*/.^()%]+$/.test(expr)) return null

    const source = expr.replace(/\s+/g, '')
    if (!source) return null

    let index = 0

    const consume = (char: string) => {
      if (source[index] === char) {
        index += 1
        return true
      }
      return false
    }

    const parseNumber = (): number | null => {
      const start = index
      let hasDigit = false

      while (/\d/.test(source[index] || '')) {
        index += 1
        hasDigit = true
      }

      if (source[index] === '.') {
        index += 1
        while (/\d/.test(source[index] || '')) {
          index += 1
          hasDigit = true
        }
      }

      if (!hasDigit) return null
      const value = Number(source.slice(start, index))
      return Number.isFinite(value) ? value : null
    }

    const parsePrimary = (): number | null => {
      if (consume('(')) {
        const value = parseExpression()
        if (value === null || !consume(')')) return null
        return value
      }

      if (consume('+')) return parsePrimary()
      if (consume('-')) {
        const value = parsePrimary()
        return value === null ? null : -value
      }

      return parseNumber()
    }

    const parsePower = (): number | null => {
      const left = parsePrimary()
      if (left === null) return null
      if (!consume('^')) return left

      const right = parsePower()
      if (right === null) return null
      return left ** right
    }

    const parseTerm = (): number | null => {
      let value = parsePower()
      if (value === null) return null

      while (true) {
        if (consume('*')) {
          const rhs = parsePower()
          if (rhs === null) return null
          value *= rhs
          continue
        }
        if (consume('/')) {
          const rhs = parsePower()
          if (rhs === null || rhs === 0) return null
          value /= rhs
          continue
        }
        if (consume('%')) {
          const rhs = parsePower()
          if (rhs === null || rhs === 0) return null
          value %= rhs
          continue
        }
        break
      }

      return value
    }

    const parseExpression = (): number | null => {
      let value = parseTerm()
      if (value === null) return null

      while (true) {
        if (consume('+')) {
          const rhs = parseTerm()
          if (rhs === null) return null
          value += rhs
          continue
        }
        if (consume('-')) {
          const rhs = parseTerm()
          if (rhs === null) return null
          value -= rhs
          continue
        }
        break
      }

      return value
    }

    const result = parseExpression()
    if (result === null || index !== source.length || !isFinite(result)) return null
    return parseFloat(result.toPrecision(12)).toString()
  } catch {
    return null
  }
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayKey(): string {
  return toLocalDateKey(new Date())
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
  const [historyResults, setHistoryResults] = useState<RecentItem[]>([])
  const { categories } = useBookmarks()
  const [settings, setSettings] = useSettings()
  const [aliases] = useLocalStorage<UrlAlias[]>('neko-aliases', [])
  const [recent, setRecent] = useLocalStorage<RecentItem[]>('neko-recent', [])
  const [, setDailyGoal] = useLocalStorage<{ text: string; date: string } | null>('neko-daily-goal', null)
  const [, setScratchpad] = useLocalStorage<string>('neko-scratchpad', '')
  const { tabs } = useOpenTabs()
  const { activeProvider, executeCommand, loadProviders } = useAIProviders()
  const { memories, saveMemory } = useAIMemory()
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiAnswer, setAiAnswer] = useState<{ text: string; urls: Array<{ label: string; url: string }>; dateKey: string } | null>(null)
  const [, setJournal] = useLocalStorage<Record<string, string>>('neko-journal', {})
  const fetchedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!isOpen) setAiAnswer(null)
  }, [isOpen])

  useEffect(() => {
    if (query) setAiAnswer(null)
  }, [query])

  useEffect(() => {
    if (isOpen && !fetchedRef.current) {
      fetchedRef.current = true
      fetchFrequentDestinations().then(historyMemories => {
        for (const m of historyMemories) {
          const existing = memories.find(x => x.keyword === m.keyword)
          if (!existing) {
            saveMemory(m.keyword, m.url, 'history')
          }
        }
      })
    }
  }, [isOpen])

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

  // Search browser history when query changes
  useEffect(() => {
    if (!query.trim() || query.startsWith('/') || query.startsWith('=') || query.startsWith('!')) {
      setHistoryResults([])
      return
    }
    if (typeof chrome === 'undefined' || !chrome.history) return
    chrome.history.search(
      { text: query, maxResults: 5, startTime: 0 },
      (items) => {
        const seen = new Set<string>()
        const mapped = items
          .filter(item => item.url && item.title)
          .map(item => ({ label: item.title!, url: item.url!, ts: item.lastVisitTime || 0 }))
          .filter(item => {
            if (seen.has(item.url)) return false
            seen.add(item.url)
            return true
          })
        setHistoryResults(mapped)
      }
    )
  }, [query])

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

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

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

    // ── AI Command — triggered by "!" prefix ──
    if (query.startsWith('!')) {
      if (activeProvider) {
        const aiQuery = query.slice(1).trim()
        if (aiQuery) {
          out.push({
            id: 'ai-command',
            label: aiQuery,
            sub: aiLoading ? 'Processing...' : 'Ask AI',
            icon: aiLoading ? <span className="cp-dots"><span /><span /><span /></span> : '✦',
            type: 'ai' as const,
            action: aiLoading ? undefined : async () => {
              setAiLoading(true)
              setAiError(null)

              try {
                // Detect date in query and fetch targeted history
                const dateRange = parseDateQuery(aiQuery)
                let dateHistory: { title: string; url: string; ts: number }[] = []
                let dateHistoryStr = ''
                if (dateRange) {
                  dateHistory = await fetchHistoryForDateRange(dateRange.startTime, dateRange.endTime)
                  if (dateHistory.length > 0) {
                    dateHistoryStr = `[${dateRange.label}]\n` + dateHistory.map(h => {
                      const time = new Date(h.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                      return `${time} — ${h.title} (${h.url})`
                    }).join('\n')
                  }
                }

                const context = buildContext(
                  aliases,
                  categories,
                  recent.slice(0, 10).map(r => ({ title: r.label, url: r.url })),
                  historyResults.slice(0, 10).map(h => ({ title: h.label, url: h.url })),
                  memories
                )

                const actions = await executeCommand(aiQuery, { ...context, browsingHistory: dateHistoryStr || undefined })
                const answerAction = actions.find(a => a.type === 'answer')
                const rememberActions = actions.filter(a => a.type === 'remember')
                const execActions = actions.filter(a => !['remember', 'answer', 'save-to-journal'].includes(a.type))

                // Handle answer display
                if (answerAction) {
                  setAiAnswer({
                    text: answerAction.value,
                    urls: answerAction.urls || [],
                    dateKey: dateRange ? toLocalDateKey(new Date(dateRange.startTime)) : toLocalDateKey(new Date()),
                  })
                  setAiLoading(false)
                  return
                }

                // Execute navigation actions
                if (execActions.length > 0) {
                  await executeActions(execActions)
                }

                for (const ra of rememberActions) {
                  if (ra.url) {
                    await saveMemory(ra.value, ra.url, 'ai')
                    showToast(`Learned: "${ra.value}" → ${ra.url}`)
                  }
                }

                if (execActions.length === 0 && rememberActions.length === 0 && !answerAction) {
                  setAiError('No actions returned from AI')
                  return
                }

                if (execActions.length > 0) {
                  showToast(`Executed ${execActions.length} action${execActions.length > 1 ? 's' : ''}`)
                }
              } catch (err) {
                setAiError(err instanceof Error ? err.message : 'AI command failed')
                return
              } finally {
                setAiLoading(false)
              }

              // Only close palette if there were no answer actions
              setIsOpen(false)
              setQuery('')
            },
          })
        }
      } else {
        out.push({
          id: 'ai-no-provider',
          label: 'No AI provider configured',
          sub: 'Add an API key in Settings > AI',
          icon: '⚠️',
          type: 'command' as const,
        })
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

    // Calculator — prefix with = 
    if (query.startsWith('=')) {
      const expr = query.slice(1).trim()
      const calcResult = expr ? tryCalc(expr) : null
      out.push({
        id: '__calc__',
        label: calcResult !== null ? `= ${calcResult}` : '= ...',
        sub: calcResult !== null ? 'Enter to copy result' : 'type an expression, e.g. = 1920/2',
        icon: '∑',
        type: 'calc',
        action: calcResult !== null ? () => {
          void navigator.clipboard.writeText(calcResult)
            .then(() => showToast(`Copied: ${calcResult}`))
            .catch(() => showToast('Clipboard copy failed'))
        } : undefined,
      })
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

    // Browser history
    const seenUrls = new Set(out.map(r => r.url).filter(Boolean))
    for (const h of historyResults) {
      if (!seenUrls.has(h.url)) {
        out.push({ id: `history-${h.url}`, label: h.label, sub: h.url, url: h.url, icon: '◷', type: 'history' })
        seenUrls.add(h.url)
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

    // Tab search — when query starts with "> " or when no other results match
    const showTabs = query.startsWith('> ') || (query.trim() && out.length <= 2)
    if (showTabs) {
      const tabQuery = query.replace(/^>\s*/, '').toLowerCase()
      for (const tab of tabs) {
        if (fuzzy(tab.title, tabQuery) || fuzzy(tab.url, tabQuery)) {
          out.push({
            id: `tab-${tab.id}`,
            label: tab.title,
            sub: tab.url,
            url: tab.url,
            icon: tab.favicon ? <img src={tab.favicon} width={16} height={16} /> : '⬡',
            type: 'tab' as const,
          })
        }
      }
    }

    return out
  }, [query, categories, aliases, engine, settings.theme, settings.font, settings.clockFormat, recent, historyResults, showToast, setSettings, setRecent, setDailyGoal, setScratchpad, tabs, activeProvider, aiLoading, executeCommand])

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    if (!resultsRef.current) return
    const el = resultsRef.current.children[selected] as HTMLElement | undefined
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const launch = (r: Result) => {
    // Command suggestion without action — autocomplete it
    if (r.type === 'command' && !r.action) {
      if (r.id.endsWith('-hint')) return
      setQuery(r.label + ' ')
      return
    }
    if (r.type === 'tab' && r.url) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.get(Number(r.id.replace('tab-', '')), (tab) => {
          if (tab.id) {
            chrome.tabs.highlight({ windowId: tab.windowId, tabs: tab.index })
            chrome.windows.update(tab.windowId || 0, { focused: true })
          }
        })
      }
      setIsOpen(false)
      setQuery('')
      return
    }
    if (r.action) {
      if (r.type === 'ai') {
        r.action()
        return
      }
      r.action()
    } else if (r.url) {
      void recordTabUsage()
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
      if (aiAnswer) {
        setIsOpen(false)
        setQuery('')
        return
      }
      if (results[selected]) {
        launch(results[selected])
      } else if (query.trim()) {
        // fallback: web search
        void recordTabUsage()
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
                placeholder="search, go to URL, or / for commands, > for tabs..."
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

            {aiAnswer ? (
              <div className="cp-answer">
                <div className="cp-answer-text">{aiAnswer.text}</div>
                {aiAnswer.urls.length > 0 && (
                  <div className="cp-answer-chips">
                    {aiAnswer.urls.map((u, i) => (
                      <button
                        key={i}
                        className="cp-chip"
                        onClick={() => {
                          if (typeof chrome !== 'undefined' && chrome.tabs) {
                            chrome.tabs.create({ url: u.url })
                          } else {
                            window.location.href = u.url
                          }
                        }}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className="cp-save-journal"
                  onClick={() => {
                    const dateKey = aiAnswer.dateKey
                    const dateLabel = new Date(dateKey + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    const linkList = aiAnswer.urls.length > 0
                      ? '\n' + aiAnswer.urls.map(u => `• ${u.label} — ${u.url}`).join('\n')
                      : ''
                    const entry = `--- AI Summary (${dateLabel}) ---\n${aiAnswer.text}${linkList}`
                    setJournal(prev => {
                      const existing = prev[dateKey] || ''
                      const sep = existing ? '\n\n' : ''
                      return { ...prev, [dateKey]: existing + sep + entry }
                    })
                    setAiAnswer(null)
                    setIsOpen(false)
                    setQuery('')
                    showToast('Saved to journal')
                  }}
                >
                  <Bookmark size={14} style={{ marginRight: 6 }} /> Save to journal
                </button>
              </div>
            ) : results.length > 0 && (
              <div className="cp-results" ref={resultsRef}>
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

            {aiError && (
              <div className="cp-ai-error">⚠️ {aiError}</div>
            )}

            {aiAnswer && (
              <div className="cp-hint-row">
                <span>Click a chip to open in new tab</span>
                <span>esc close</span>
              </div>
            )}
            {!query && !aiAnswer && (
              <div className="cp-hint-row">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>/commands</span>
                <span>&gt; tabs</span>
                {activeProvider && <span>! AI</span>}
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
