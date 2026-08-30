import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useGmail } from '../connectors/gmail/useGmail'
import { useSettings } from '../hooks/useLocalStorage'
import { getConnectorConfig } from '../connectors/types'

const GMAIL_URL = 'https://mail.google.com'

export function GmailStatus() {
  const [settings] = useSettings()
  const enabled = !!getConnectorConfig(settings, 'gmail').enabled
  const wasConnected = useRef(() => localStorage.getItem('neko-gmail-connected') === 'true')
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { emails, unreadCount, isConnected } = useGmail(enabled)

  const close = useCallback((e: MouseEvent) => {
    const target = e.target as Node
    if (buttonRef.current?.contains(target)) return
    if ((target as Element).closest?.('[data-gmail-popup]')) return
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, close])

  if (!enabled || (!isConnected && !wasConnected.current())) return null

  const latest = emails[0]?.subject

  return (
    <>
      <button
        ref={buttonRef}
        className="stat-item gmail-stat-item"
        title={latest ? `${unreadCount} unread — latest: ${latest}` : 'inbox zero'}
        onClick={() => setOpen(o => !o)}
      >
        <span className="stat-label">GMAIL</span>
        <span className="stat-value">
          {unreadCount > 0 ? `${unreadCount} unread` : 'inbox zero'}
          {latest && unreadCount > 0 && <span className="gmail-latest"> · {latest}</span>}
        </span>
      </button>

      {open && buttonRef.current && createPortal(
        <div
          data-gmail-popup
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: Math.max(16, buttonRef.current.getBoundingClientRect().left),
            bottom: window.innerHeight - buttonRef.current.getBoundingClientRect().top + 6,
            background: 'var(--bg-color, #111)',
            border: '1px solid rgba(128,128,128,0.35)',
            borderRadius: '6px',
            padding: '12px 14px',
            textAlign: 'left',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
            overflowY: 'auto',
            width: '420px',
            maxWidth: '90vw',
            maxHeight: '50vh',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>
              inbox{unreadCount > 0 ? ` — ${unreadCount} unread` : ''}
            </span>
            <a
              href={GMAIL_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.78rem', opacity: 0.85 }}
            >
              open gmail ↗
            </a>
          </div>
          {emails.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {emails.slice(0, 8).map((email) => (
                <li key={email.id} style={{ lineHeight: 1.7 }}>
                  <a
                    href={GMAIL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', gap: '10px', color: 'var(--text-color)', textDecoration: 'none', opacity: 0.8 }}
                    title={`${email.from}: ${email.subject}`}
                  >
                    <span style={{ opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', flexShrink: 0 }}>
                      {email.from}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.subject}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.82rem' }}>inbox zero — nothing unread</p>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
