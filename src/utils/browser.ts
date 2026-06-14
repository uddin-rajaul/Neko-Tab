declare global {
  var browser: typeof chrome | undefined
}

export function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

declare const __GOOGLE_CLIENT_ID__: string
declare const __GOOGLE_CLIENT_SCOPES__: string

function getRuntimeId(): string | undefined {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) return chrome.runtime.id
    if (typeof browser !== 'undefined' && browser?.runtime?.id) return browser.runtime.id
  } catch { /* not in extension context */ }
  return undefined
}

function getManifest(): chrome.runtime.Manifest | undefined {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      return chrome.runtime.getManifest()
    }
    if (typeof browser !== 'undefined' && browser?.runtime?.getManifest) {
      return browser.runtime.getManifest()
    }
  } catch { /* not in extension context */ }
  return undefined
}

export function isIdentityAvailable(): boolean {
  return (
    (typeof chrome !== 'undefined' && !!chrome.identity) ||
    (typeof browser !== 'undefined' && !!browser?.identity)
  )
}

function getManifestValue<T>(path: string[]): T | undefined {
  try {
    const manifest = getManifest()
    if (!manifest) return undefined
    let value: unknown = manifest
    for (const key of path) {
      if (value == null || typeof value !== 'object') return undefined
      value = (value as Record<string, unknown>)[key]
    }
    return value as T
  } catch {
    return undefined
  }
}

function getGoogleClientId(): string {
  return getManifestValue<string>(['oauth2', 'client_id'])
    || (typeof __GOOGLE_CLIENT_ID__ !== 'undefined' ? __GOOGLE_CLIENT_ID__ : '')
    || ''
}

function getGoogleScopes(): string[] {
  const fromManifest = getManifestValue<string[]>(['oauth2', 'scopes'])
  if (fromManifest && fromManifest.length > 0) return fromManifest
  if (typeof __GOOGLE_CLIENT_SCOPES__ !== 'undefined') {
    return __GOOGLE_CLIENT_SCOPES__.split(',').filter(Boolean)
  }
  return []
}

function getRedirectUri(): string {
  if (typeof chrome !== 'undefined' && chrome.identity?.getRedirectURL) {
    return chrome.identity.getRedirectURL()
  }
  if (typeof browser !== 'undefined' && browser?.identity?.getRedirectURL) {
    return browser.identity.getRedirectURL()
  }
  const id = getRuntimeId()
  if (id) {
    return `https://${id}.chromiumapp.org/`
  }
  return 'https://localhost/'
}

export function getAuthToken(interactive: boolean): Promise<string | null> {
  if (typeof chrome !== 'undefined' && chrome.identity?.getAuthToken) {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive }, (result) => {
        if (chrome?.runtime?.lastError) {
          resolve(null)
          return
        }
        const token = result as unknown as string | undefined
        resolve(token ?? null)
      })
    })
  }

  if (typeof browser !== 'undefined' && browser?.identity?.launchWebAuthFlow) {
    const clientId = getGoogleClientId()
    if (!clientId) return Promise.resolve(null)

    const scopes = getGoogleScopes()
    const redirectUri = getRedirectUri()

    const state = crypto.randomUUID()

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'token',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state,
    })

    const authUrl = `https://accounts.google.com/o/oauth2/auth?${params}`

    return browser.identity.launchWebAuthFlow({ url: authUrl, interactive })
      .then((redirectUrl) => {
        if (!redirectUrl) return null
        const fragment = redirectUrl.split('#')[1]
        if (!fragment) return null
        const fragmentParams = new URLSearchParams(fragment)
        if (fragmentParams.get('state') !== state) return null
        return fragmentParams.get('access_token')
      })
      .catch(() => null)
  }

  return Promise.resolve(null)
}

export function removeCachedAuthToken(token: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.identity?.removeCachedAuthToken) {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => resolve())
    })
  }

  return Promise.resolve()
}
