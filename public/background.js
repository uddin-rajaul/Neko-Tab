// Background service worker for Focus Mode site blocking

const RULE_ID_START = 1000
const DISTRACTION_LOG_PREFIX = 'focus-distraction-log:'
let activeFocusBlocking = { isActive: false, blockedDomains: [], sessionId: null }

loadFocusBlockingState()

// Startup Sites shortcut handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-startup-sites') return

  // Read fresh from disk each time — service worker may have cached stale state
  const all = await chrome.storage.local.get(null)
  const sitesRaw = all.neko_startup_sites
  const enabled = all.neko_startup_enabled

  if (!enabled) return

  const sites = Array.isArray(sitesRaw) ? sitesRaw : []
  if (sites.length === 0) return

  // Show the card instead of opening directly — user confirms from the launcher
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (activeTab?.id != null) {
    void chrome.tabs.sendMessage(activeTab.id, { type: 'neko-show-startup-card' }).catch(() => {
      // Tab may not have a listener — that's fine
    })
  }
})

// Listen for changes to focus blocking state
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.focusBlocking) {
    const { isActive, blockedDomains, sessionId } = changes.focusBlocking.newValue || { isActive: false, blockedDomains: [], sessionId: null }
    activeFocusBlocking = { isActive, blockedDomains, sessionId: sessionId ?? null }
    updateBlockingRules(isActive, blockedDomains)
  }
})

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  // Clear any stale blocking rules on browser start
  await clearAllBlockingRules()
})

// Also clear rules when extension is installed/updated
chrome.runtime.onInstalled.addListener(async () => {
  await clearAllBlockingRules()
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'neko-sync-focus-blocking') {
    const payload = message.payload || { isActive: false, blockedDomains: [], sessionId: null }
    const nextState = {
      isActive: Boolean(payload.isActive),
      blockedDomains: Array.isArray(payload.blockedDomains) ? payload.blockedDomains : [],
      sessionId: payload.sessionId ?? null,
    }

    activeFocusBlocking = nextState

    void (async () => {
      await updateBlockingRules(nextState.isActive, nextState.blockedDomains)
      sendResponse({ ok: true })
    })()

    return true
  }

  if (message?.type === 'neko-focus-session-complete') {
    void chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Focus session complete!',
      message: 'Great job. Take a break.',
    })
    sendResponse({ ok: true })
    return true
  }

  if (message?.type !== 'neko-blocked-page-viewed') return

  void (async () => {
    if (!activeFocusBlocking.isActive || !activeFocusBlocking.sessionId) {
      sendResponse({ ok: false })
      return
    }

    const domain = getDomainFromReferrer(message.referrer) ?? 'blocked site'
    await logDistractionAttempt(activeFocusBlocking.sessionId, domain)
    sendResponse({ ok: true })
  })()

  return true
})

chrome.webRequest.onBeforeRequest.addListener(async details => {
  if (!activeFocusBlocking.isActive || !activeFocusBlocking.sessionId) return

  try {
    const url = new URL(details.url)
    if (!isBlockedHost(url.hostname, activeFocusBlocking.blockedDomains)) return
    await logDistractionAttempt(activeFocusBlocking.sessionId, url.hostname)
  } catch (error) {
    console.error('Failed to log distraction attempt:', error)
  }
}, { urls: ['<all_urls>'], types: ['main_frame'] })

async function loadFocusBlockingState() {
  try {
    const { focusBlocking } = await chrome.storage.local.get('focusBlocking')
    if (focusBlocking) {
      activeFocusBlocking = {
        isActive: Boolean(focusBlocking.isActive),
        blockedDomains: Array.isArray(focusBlocking.blockedDomains) ? focusBlocking.blockedDomains : [],
        sessionId: focusBlocking.sessionId ?? null,
      }

      if (activeFocusBlocking.isActive) {
        await updateBlockingRules(activeFocusBlocking.isActive, activeFocusBlocking.blockedDomains)
      }
    }
  } catch (error) {
    console.error('Failed to load focus blocking state:', error)
  }
}

function isBlockedHost(hostname, blockedDomains) {
  const normalizedHost = normalizeDomain(hostname)
  return blockedDomains
    .map(normalizeDomain)
    .filter(Boolean)
    .some(domain => normalizedHost === domain || normalizedHost.endsWith(`.${domain}`))
}

async function logDistractionAttempt(sessionId, domain) {
  const storageKey = `${DISTRACTION_LOG_PREFIX}${sessionId}`
  const current = await chrome.storage.local.get(storageKey)
  const attempts = Array.isArray(current[storageKey]) ? current[storageKey] : []
  const lastAttempt = attempts[attempts.length - 1]
  const now = Date.now()

  if (lastAttempt && lastAttempt.domain === domain && now - lastAttempt.attemptedAt < 2000) {
    return
  }

  attempts.push({
    domain,
    attemptedAt: now,
  })

  await chrome.storage.local.set({
    [storageKey]: attempts,
  })
}

function getDomainFromReferrer(referrer) {
  if (!referrer) return null

  try {
    return new URL(referrer).hostname
  } catch {
    return null
  }
}

function normalizeDomain(domain) {
  if (typeof domain !== 'string') return ''

  return domain
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.+$/, '')
}

async function updateBlockingRules(isActive, blockedDomains) {
  // First, remove all existing focus mode rules
  await clearAllBlockingRules()

  const normalizedDomains = Array.from(
    new Set((blockedDomains || []).map(normalizeDomain).filter(Boolean))
  )

  if (!isActive || normalizedDomains.length === 0) {
    return
  }

  const rules = normalizedDomains.map((domain, index) => ({
    id: RULE_ID_START + index,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: '/blocked.html'
      }
    },
    condition: {
      requestDomains: [domain],
      resourceTypes: ['main_frame']
    }
  }))

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
      removeRuleIds: []
    })
    console.log('Focus mode blocking enabled for:', normalizedDomains)
  } catch (error) {
    console.error('Failed to update blocking rules:', error)
  }
}

async function clearAllBlockingRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
    const ruleIds = existingRules.map(rule => rule.id)
    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds,
        addRules: []
      })
    }
    console.log('Focus mode blocking disabled')
  } catch (error) {
    console.error('Failed to clear blocking rules:', error)
  }
}
