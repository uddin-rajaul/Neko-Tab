import type { RssFeed, RssItem, RssCache } from '../types/rss'

const CACHE_KEY = 'nekotab-rss-cache'
export const RSS_REFRESH_MINUTES = 30
const RSS_REFRESH_MS = RSS_REFRESH_MINUTES * 60 * 1000

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url='

function readCache(): RssCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RssCache
  } catch {
    return null
  }
}

function writeCache(items: RssItem[]): void {
  const cache: RssCache = { items, fetchedAt: Date.now() }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function getCachedRss(): RssCache | null {
  return readCache()
}

export function isRssCacheStale(): boolean {
  const cache = readCache()
  if (!cache) return true
  return Date.now() - cache.fetchedAt > RSS_REFRESH_MS
}

export function clearRssCache(): void {
  localStorage.removeItem(CACHE_KEY)
}

function parseRssXml(xml: string, feed: RssFeed): RssItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const items = doc.querySelectorAll('item, entry')
  return Array.from(items)
    .slice(0, feed.maxItems)
    .map(el => {
      const linkEl = el.querySelector('link')
      let link = linkEl?.getAttribute('href') ?? linkEl?.textContent ?? ''
      // Atom links can be in href attribute
      if (!link && linkEl) link = linkEl.getAttribute('href') ?? ''
      return {
        title: el.querySelector('title')?.textContent ?? 'Untitled',
        link,
        pubDate: el.querySelector('pubDate, published, updated')?.textContent ?? '',
        feedId: feed.id,
        feedName: feed.name,
      }
    })
    .filter(item => item.title !== 'Untitled' || item.link)
}

async function fetchDirect(feed: RssFeed): Promise<RssItem[]> {
  const res = await fetch(feed.url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const items = parseRssXml(text, feed)
  if (items.length === 0) throw new Error('No items found in feed')
  return items
}

async function fetchViaRss2json(feed: RssFeed): Promise<RssItem[]> {
  const url = RSS2JSON_BASE + encodeURIComponent(feed.url)
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`rss2json HTTP ${res.status}`)
  const json = await res.json()
  if (json.status === 'error' || !json.items) throw new Error(json.message ?? 'rss2json error')
  return json.items.slice(0, feed.maxItems).map((item: any) => ({
    title: item.title ?? 'Untitled',
    link: item.link ?? item.guid ?? '',
    pubDate: item.pubDate ?? item.isoDate ?? '',
    feedId: feed.id,
    feedName: feed.name,
  }))
}

export async function fetchFeed(feed: RssFeed): Promise<RssItem[]> {
  try {
    return await fetchDirect(feed)
  } catch {
    return await fetchViaRss2json(feed)
  }
}

export async function fetchFeedForValidation(url: string): Promise<{ title: string; items: RssItem[] }> {
  // Try direct first
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (res.ok) {
      const text = await res.text()
      const doc = new DOMParser().parseFromString(text, 'application/xml')
      // Extract channel/blog title
      const title = doc.querySelector('channel > title, feed > title')?.textContent ?? ''
      const items = Array.from(doc.querySelectorAll('item, entry')).slice(0, 10).map(el => {
        const linkEl = el.querySelector('link')
        let link = linkEl?.getAttribute('href') ?? linkEl?.textContent ?? ''
        return {
          title: el.querySelector('title')?.textContent ?? 'Untitled',
          link,
          pubDate: el.querySelector('pubDate, published, updated')?.textContent ?? '',
          feedId: '',
          feedName: title,
        }
      })
      if (items.length > 0) return { title, items }
    }
  } catch { /* fall through */ }

  // Fallback to rss2json
  const rss2url = RSS2JSON_BASE + encodeURIComponent(url)
  const res = await fetch(rss2url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Unable to fetch feed')
  const json = await res.json()
  if (json.status === 'error' || !json.items?.length) throw new Error('Unable to fetch feed. Try a different URL or enable fallback proxy.')
  return {
    title: json.feed?.title ?? '',
    items: json.items.slice(0, 10).map((item: any) => ({
      title: item.title ?? 'Untitled',
      link: item.link ?? '',
      pubDate: item.pubDate ?? item.isoDate ?? '',
      feedId: '',
      feedName: json.feed?.title ?? '',
    })),
  }
}

export async function refreshAllFeeds(feeds: RssFeed[]): Promise<RssItem[]> {
  const enabled = feeds.filter(f => f.enabled)
  if (enabled.length === 0) return []

  const results = await Promise.allSettled(enabled.map(f => fetchFeed(f)))
  const allItems: RssItem[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value)
    }
  }

  // Sort by date, newest first
  allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
    return db - da
  })

  writeCache(allItems)
  return allItems
}

export function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
