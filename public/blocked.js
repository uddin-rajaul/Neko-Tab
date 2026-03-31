const DISTRACTION_LOG_PREFIX = 'focus-distraction-log:'

async function logBlockedAttempt() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return

  try {
    const { focusBlocking } = await chrome.storage.local.get('focusBlocking')
    if (!focusBlocking?.isActive || !focusBlocking?.sessionId) return

    const storageKey = `${DISTRACTION_LOG_PREFIX}${focusBlocking.sessionId}`
    const raw = localStorage.getItem(storageKey)
    const attempts = raw ? JSON.parse(raw) : []
    const domain = getDomainFromReferrer(document.referrer) ?? 'blocked site'
    const now = Date.now()
    const lastAttempt = attempts[attempts.length - 1]

    if (lastAttempt && lastAttempt.domain === domain && now - lastAttempt.attemptedAt < 2000) {
      return
    }

    attempts.push({
      domain,
      attemptedAt: now,
    })

    localStorage.setItem(storageKey, JSON.stringify(attempts))
  } catch {
    // Ignore logging failures on the blocked page.
  }
}

function getDomainFromReferrer(referrer) {
  if (!referrer) return null

  try {
    return new URL(referrer).hostname
  } catch {
    return null
  }
}

void logBlockedAttempt()
