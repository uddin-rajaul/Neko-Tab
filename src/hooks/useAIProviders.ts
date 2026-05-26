import { useState, useCallback } from 'react'
import type { AIProvider, AIProviderConfig, AIAction } from '../types'

const PROVIDER_DEFAULTS: Record<AIProvider, { name: string; baseUrl: string; model: string }> = {
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-haiku-20240307' },
  gemini: { name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1', model: 'gemini-2.5-flash' },
  custom: { name: 'Custom API', baseUrl: '', model: '' },
}

function sanitize(str: string): string {
  return str.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200)
}

export function useAIProviders() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([])
  const [activeProvider, setActiveProvider] = useState<AIProvider | null>(null)

  const loadProviders = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return

    const stored = await chrome.storage.local.get('ai-providers') as { 'ai-providers'?: AIProviderConfig[] }
    if (stored['ai-providers']) {
      setProviders(stored['ai-providers'])
    }

    const active = await chrome.storage.local.get('ai-active-provider') as { 'ai-active-provider'?: AIProvider }
    if (active['ai-active-provider']) {
      setActiveProvider(active['ai-active-provider'])
    }
  }, [])

  const saveProvider = useCallback(async (provider: AIProviderConfig) => {
    setProviders(prev => {
      const filtered = prev.filter(p => p.provider !== provider.provider)
      const updated = [...filtered, provider]

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ 'ai-providers': updated })
      }

      return updated
    })
  }, [])

  const removeProvider = useCallback(async (provider: AIProvider) => {
    setProviders(prev => {
      const updated = prev.filter(p => p.provider !== provider)

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ 'ai-providers': updated })
      }

      return updated
    })

    if (activeProvider === provider) {
      setActiveProvider(null)
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ 'ai-active-provider': null })
      }
    }
  }, [activeProvider])

  const setActive = useCallback(async (provider: AIProvider | null) => {
    setActiveProvider(provider)
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ 'ai-active-provider': provider })
    }
  }, [])

  const executeCommand = useCallback(async (
    prompt: string,
    context: { aliases: string; bookmarks: string; tabs: string; history: string; memories: string }
  ): Promise<AIAction[]> => {
    const currentActive = activeProvider
    if (!currentActive) {
      throw new Error('No active AI provider configured')
    }

    const providerConfig = providers.find(p => p.provider === currentActive)
    if (!providerConfig?.apiKey) {
      throw new Error(`API key not set for ${currentActive}`)
    }

    const defaults = PROVIDER_DEFAULTS[currentActive]
    const baseUrl = providerConfig.baseUrl || defaults.baseUrl
    const model = providerConfig.model && providerConfig.model !== 'gemini-1.5-flash' ? providerConfig.model : defaults.model

    const safeQuery = sanitize(prompt)

    const systemPrompt = `You are a command interpreter. Given the user's context and request, respond with a JSON array of actions.

You are a command interpreter. Given the user's context and request, respond with a JSON array of actions.

When the user says "open X", check the known destinations first. If X matches a known destination, use its exact URL. For example:
- "open slack" → {"type": "open_url", "value": "https://slack.com"}
- "open slack and discord" → {"type": "open_tabs", "value": "https://slack.com, https://discord.com"}
- "open gmail" → {"type": "open_url", "value": "https://mail.google.com"}
- "open youtube" → {"type": "open_url", "value": "https://youtube.com"}
- "open google docs my resume" → {"type": "search", "value": "my resume google docs"}

If you open a URL that isn't in known destinations, append a remember action so the system learns it.

Only use "search" when you genuinely don't know the URL. Prefer "open_url" for known websites.

Context:
<context>
aliases: ${sanitize(context.aliases)}
bookmarks: ${sanitize(context.bookmarks)}
open tabs: ${sanitize(context.tabs)}
recent history: ${sanitize(context.history)}
known destinations:
${sanitize(context.memories)}
</context>

User request:
<user_query>${safeQuery}</user_query>

Available actions:
- {"type": "open_url", "value": "<full url>"} — navigate to a URL
- {"type": "search", "value": "<search query>"} — Google search (only when URL is unknown)
- {"type": "open_tabs", "value": "<url1>, <url2>, ..."} — open multiple URLs in new tabs
- {"type": "alias", "value": "<alias key>"} — use a saved alias
- {"type": "history", "value": "<search term for chrome history>"} — search browser history
- {"type": "remember", "value": "<keyword>", "url": "<full url>"} — save a new memory mapping

Respond ONLY with a valid JSON array. No markdown, no explanation.`

    let response: Response

    if (currentActive === 'gemini') {
      response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${providerConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
      })
    } else if (currentActive === 'openai' || currentActive === 'custom') {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: 0.3,
        }),
      })
    } else if (currentActive === 'anthropic') {
      response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': providerConfig.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: systemPrompt }],
        }),
      })
    } else {
      throw new Error(`Unknown provider: ${currentActive}`)
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI API error: ${response.status} — ${error}`)
    }

    const data = await response.json()
    let content = ''

    if (currentActive === 'openai' || currentActive === 'custom') {
      content = data.choices?.[0]?.message?.content || ''
    } else if (currentActive === 'anthropic') {
      content = data.content?.[0]?.text || ''
    } else if (currentActive === 'gemini') {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('AI response was not valid JSON')
    }

    const actions = JSON.parse(jsonMatch[0]) as AIAction[]
    return actions
  }, [activeProvider, providers])

  return {
    providers,
    activeProvider,
    loadProviders,
    saveProvider,
    removeProvider,
    setActive,
    executeCommand,
    providerDefaults: PROVIDER_DEFAULTS,
  }
}
