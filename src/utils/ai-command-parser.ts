import type { AIAction, AIMemory } from '../types'

const VALID_TYPES = new Set(['open_url', 'search', 'alias', 'open_tabs', 'history', 'remember', 'custom'])

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
    if (action.type === 'remember') continue

    await new Promise(resolve => setTimeout(resolve, 300))

    switch (action.type) {
      case 'open_url': {
        const url = action.value.startsWith('http') ? action.value : `https://${action.value}`
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
        window.location.href = action.value
        return

      case 'open_tabs': {
        const urls = action.value.split(',').map(u => u.trim())
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          for (const url of urls) {
            if (url) {
              chrome.tabs.create({ url: url.startsWith('http') ? url : `https://${url}` })
            }
          }
        }
        break
      }

      case 'history':
        if (typeof chrome !== 'undefined' && chrome.history) {
          chrome.history.search({ text: action.value, maxResults: 5 }, results => {
            if (results[0]?.url) {
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
