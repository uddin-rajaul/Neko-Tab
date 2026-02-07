// Background service worker for Focus Mode site blocking

const RULE_ID_START = 1000

// Listen for changes to focus blocking state
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.focusBlocking) {
    const { isActive, blockedDomains } = changes.focusBlocking.newValue || { isActive: false, blockedDomains: [] }
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
