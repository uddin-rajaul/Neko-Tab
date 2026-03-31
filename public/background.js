// Background service worker for Focus Mode site blocking

const RULE_ID_START = 1000
const DISTRACTION_LOG_PREFIX = 'focus-distraction-log:'
let activeFocusBlocking = { isActive: false, blockedDomains: [], sessionId: null }

loadFocusBlockingState()

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
    }
  } catch (error) {
    console.error('Failed to load focus blocking state:', error)
  }
}

function isBlockedHost(hostname, blockedDomains) {
  return blockedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
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

async function updateBlockingRules(isActive, blockedDomains) {
  // First, remove all existing focus mode rules
  await clearAllBlockingRules()

  if (!isActive || !blockedDomains || blockedDomains.length === 0) {
    return
  }

  // Create new rules for each blocked domain
  const rules = blockedDomains.map((domain, index) => ({
    id: RULE_ID_START + index,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: '/blocked.html'
      }
    },
    condition: {
      urlFilter: `*://*.${domain}/*`,
      resourceTypes: ['main_frame']
    }
  }))

  // Also block the root domain without www
  const rootRules = blockedDomains.map((domain, index) => ({
    id: RULE_ID_START + blockedDomains.length + index,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: '/blocked.html'
      }
    },
    condition: {
      urlFilter: `*://${domain}/*`,
      resourceTypes: ['main_frame']
    }
  }))

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [...rules, ...rootRules],
      removeRuleIds: []
    })
    console.log('Focus mode blocking enabled for:', blockedDomains)
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
