export interface RssFeed {
  id: string
  name: string
  url: string
  enabled: boolean
  maxItems: number // 1–10, default 5
}

export interface RssItem {
  title: string
  link: string
  pubDate: string // ISO string
  feedId: string
  feedName: string
}

export interface RssCache {
  items: RssItem[]
  fetchedAt: number
}
