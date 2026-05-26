import { useCallback, useEffect, useState } from 'react'
import type { AIMemory } from '../types'

const STORAGE_KEY = 'neko-ai-memories'

async function read(): Promise<AIMemory[]> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    return (stored[STORAGE_KEY] ?? []) as AIMemory[]
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

async function write(memories: AIMemory[]): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: memories })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories))
}

export function useAIMemory() {
  const [memories, setMemories] = useState<AIMemory[]>([])

  useEffect(() => {
    read().then(setMemories)
  }, [])

  const saveMemory = useCallback(async (keyword: string, url: string, source: AIMemory['source']) => {
    const existing = await read()
    const idx = existing.findIndex(m => m.keyword === keyword)
    const entry: AIMemory = {
      keyword,
      url,
      usageCount: idx >= 0 ? existing[idx].usageCount + 1 : 1,
      lastUsed: Date.now(),
      source,
    }
    const updated = idx >= 0
      ? [...existing.slice(0, idx), entry, ...existing.slice(idx + 1)]
      : [...existing, entry]
    await write(updated)
    setMemories(updated)
    return entry
  }, [])

  const deleteMemory = useCallback(async (keyword: string) => {
    const existing = await read()
    const updated = existing.filter(m => m.keyword !== keyword)
    await write(updated)
    setMemories(updated)
  }, [])

  const updateMemory = useCallback(async (keyword: string, updates: Partial<AIMemory>) => {
    const existing = await read()
    const idx = existing.findIndex(m => m.keyword === keyword)
    if (idx < 0) return
    const updated = [...existing]
    updated[idx] = { ...updated[idx], ...updates }
    await write(updated)
    setMemories(updated)
  }, [])

  const clearAll = useCallback(async () => {
    await write([])
    setMemories([])
  }, [])

  return { memories, saveMemory, deleteMemory, updateMemory, clearAll }
}
