import type { AIAction, AIMemory } from '../types'
import { isSafeUrl } from './browser'

const VALID_TYPES = new Set(['open_url', 'search', 'alias', 'open_tabs', 'history', 'remember', 'custom', 'answer', 'save-to-journal'])

export function parseAIActions(response: string): AIAction[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON array found in AI response')
      return []
    }

    const actions = JSON.parse(jsonMatch[0]) as AIAction[]

    return actions.filter(action =>
      action.type && action.value && VALID_TYPES.has(action.type)
    )
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return []
  }
}

export async function executeActions(actions: AIAction[]): Promise<void> {
  for (const action of actions) {
    if (action.type === 'remember' || action.type === 'answer' || action.type === 'save-to-journal') continue

    await new Promise(resolve => setTimeout(resolve, 300))

    switch (action.type) {
      case 'open_url': {
        const url = isSafeUrl(action.value) ? action.value : `https://${action.value}`
        if (!isSafeUrl(url)) break
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url })
        } else {
          window.location.href = url
          return
        }
        break
      }

      case 'search': {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(action.value)}`
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: searchUrl })
        } else {
          window.location.href = searchUrl
          return
        }
        break
      }

      case 'alias':
        if (isSafeUrl(action.value)) {
          window.location.href = action.value
          return
        }
        break

      case 'open_tabs': {
        const urls = action.value.split(',').map(u => u.trim())
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          for (const url of urls) {
            const safe = isSafeUrl(url) ? url : `https://${url}`
            if (url && isSafeUrl(safe)) {
              chrome.tabs.create({ url: safe })
            }
          }
        }
        break
      }

      case 'history':
        if (typeof chrome !== 'undefined' && chrome.history) {
          chrome.history.search({ text: action.value, maxResults: 5 }, results => {
            if (results[0]?.url && isSafeUrl(results[0].url)) {
              window.location.href = results[0].url
            }
          })
        }
        break

      case 'custom':
        console.log('Custom AI action:', action.value)
        break
    }
  }
}

export async function fetchFrequentDestinations(): Promise<AIMemory[]> {
  if (typeof chrome === 'undefined' || !chrome.history) return []

  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const items = await new Promise<chrome.history.HistoryItem[]>((resolve) => {
      chrome.history.search({ text: '', maxResults: 200, startTime: thirtyDaysAgo }, resolve)
    })

    const domainMap = new Map<string, Map<string, number>>()
    for (const item of items) {
      if (!item.url || item.url.startsWith('chrome://') || item.url.startsWith('chrome-extension://')) continue
      try {
        const url = new URL(item.url)
        const domain = url.hostname.replace(/^www\./, '')
        if (!domainMap.has(domain)) domainMap.set(domain, new Map())
        const urlMap = domainMap.get(domain)!
        urlMap.set(item.url, (urlMap.get(item.url) || 0) + (item.visitCount || 1))
      } catch { }
    }

    const result: AIMemory[] = []
    for (const [domain, urlMap] of domainMap) {
      let bestUrl = ''
      let bestCount = 0
      for (const [url, count] of urlMap) {
        if (count > bestCount) {
          bestCount = count
          bestUrl = url
        }
      }
      if (bestUrl) {
        result.push({
          keyword: domain,
          url: bestUrl,
          usageCount: bestCount,
          lastUsed: Date.now(),
          source: 'history',
        })
      }
    }

    result.sort((a, b) => b.usageCount - a.usageCount)
    return result.slice(0, 30)
  } catch {
    return []
  }
}

function strip(str: string): string {
  return str.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200)
}

export function buildContext(
  aliases: { key: string; url: string }[],
  categories: { name: string; bookmarks: { title: string; url: string }[] }[],
  tabs: { title: string; url: string }[],
  history: { title: string; url: string }[],
  memories: AIMemory[] = [],
): { aliases: string; bookmarks: string; tabs: string; history: string; memories: string } {
  return {
    aliases: aliases.map(a => `${a.key} -> ${a.url}`).join(', '),
    bookmarks: categories.flatMap(c =>
      c.bookmarks.map(b => `${b.title}: ${b.url}`)
    ).map(s => strip(s)).join('; '),
    tabs: tabs.map(t => strip(t.title)).join(', '),
    history: history.map(h => strip(h.title)).join(', '),
    memories: memories.map(m => `${m.keyword} -> ${m.url}`).join('\n'),
  }
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const MONTH_SHORT = MONTHS.map(m => m.slice(0, 3))
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function parseMonthWord(word: string): number | null {
  const lower = word.toLowerCase()
  const idx = MONTHS.indexOf(lower)
  if (idx !== -1) return idx
  const shortIdx = MONTH_SHORT.indexOf(lower)
  if (shortIdx !== -1) return shortIdx
  return null
}

export function parseDateQuery(query: string): { startTime: number; endTime: number; label: string } | null {
  const lower = query.toLowerCase()
  const now = new Date()

  // "today"
  if (/\btoday\b/.test(lower)) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { startTime: start.getTime(), endTime: now.getTime(), label: 'today' }
  }

  // "yesterday"
  if (/\byesterday\b/.test(lower)) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { startTime: start.getTime(), endTime: end.getTime(), label: 'yesterday' }
  }

  // "this month"
  if (/\bthis month\b/.test(lower)) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { startTime: start.getTime(), endTime: now.getTime(), label: 'this month' }
  }

  // "last month"
  if (/\blast month\b/.test(lower)) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 1)
    return { startTime: start.getTime(), endTime: end.getTime(), label: 'last month' }
  }

  // "last week"
  if (/\blast week\b/.test(lower)) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { startTime: start.getTime(), endTime: end.getTime(), label: 'the last 7 days' }
  }

  // Day of week — "on Monday", "last Tuesday", "this Friday"
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const dayPat = new RegExp(`\\b(on |last |this )?${DAY_NAMES[i]}\\b`, 'i')
    if (dayPat.test(lower)) {
      const target = i
      const currentDay = now.getDay()
      let diff = target - currentDay
      if (diff > 0) diff -= 7
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      return { startTime: start.getTime(), endTime: end.getTime(), label: DAY_NAMES[i] }
    }
  }

  // "May 30", "30 May", "May 30th" etc.
  const datePatterns = [
    // "May 30" or "May 30th"
    /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
    // "30 May" or "30th May"
    /(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)/i,
  ]

  for (const pattern of datePatterns) {
    const match = query.match(pattern)
    if (!match) continue

    let monthIdx: number | null = null
    let day: number | null = null

    if (pattern === datePatterns[0]) {
      monthIdx = parseMonthWord(match[1])
      day = parseInt(match[2], 10)
    } else {
      day = parseInt(match[1], 10)
      monthIdx = parseMonthWord(match[2])
    }

    if (monthIdx === null || day === null || day < 1 || day > 31) continue

    const date = new Date(now.getFullYear(), monthIdx, day)
    const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    return { startTime: start.getTime(), endTime: end.getTime(), label }
  }

  return null
}

export async function fetchHistoryForDateRange(startTime: number, endTime: number): Promise<{ title: string; url: string; ts: number }[]> {
  if (typeof chrome === 'undefined' || !chrome.history) return []

  try {
    const items = await new Promise<chrome.history.HistoryItem[]>((resolve) => {
      chrome.history.search({ text: '', startTime, endTime, maxResults: 200 }, resolve)
    })

    return items
      .filter(item => item.url && item.title && !item.url.startsWith('chrome://') && !item.url.startsWith('chrome-extension://'))
      .map(item => ({
        title: item.title!,
        url: item.url!,
        ts: item.lastVisitTime || 0,
      }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 50)
  } catch (e) {
    console.error('fetchHistoryForDateRange failed:', e)
    return []
  }
}
