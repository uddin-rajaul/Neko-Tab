import { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Sparkles, RefreshCw, ChevronDown } from 'lucide-react';
import { useGmail, type GmailEmail } from './useGmail';
import { useSettings } from '../../hooks/useLocalStorage';
import { getConnectorConfig } from '../types';
import { useAIProviders } from '../../hooks/useAIProviders';

const CONNECTOR_ID = 'gmail';
const GMAIL_URL = 'https://mail.google.com';

interface StoredDigest {
  text: string;
  date: string; // YYYY-MM-DD the digest was generated for
  lastAttempt?: string; // YYYY-MM-DD of last auto-attempt (avoids retry spam)
}

function readDigest(): StoredDigest | null {
  try {
    const cached = localStorage.getItem('neko-gmail-digest');
    if (cached) return JSON.parse(cached);
  } catch { /* ignore corrupt cache */ }
  return null;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildPrompt(emails: GmailEmail[]): string {
  const list = emails
    .map((e, i) => `${i + 1}. From: ${e.from} | Subject: ${e.subject} | Preview: ${e.snippet}`)
    .join('\n');
  return `Summarize the user's unread email inbox. Group by what matters: urgent/personal first, then newsletters/notifications. Reply in 2-4 short plain-text lines, no markdown formatting. Mention sender names where useful.

Unread emails:
${list}`;
}

export function GmailDigest() {
  const [settings] = useSettings();
  const config = getConnectorConfig(settings, CONNECTOR_ID);
  const enabled = !!config.enabled;

  const { emails, unreadCount, isConnected, error } = useGmail(enabled);

  const [digest, setDigest] = useState<StoredDigest | null>(readDigest);
  const [summarizing, setSummarizing] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [wasConnected] = useState(() => localStorage.getItem('neko-gmail-connected') === 'true');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoAttempted = useRef(false);

  const { loadProviders, completeText, activeProvider } = useAIProviders();

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const summarize = useCallback(async () => {
    if (!activeProvider || summarizing || emails.length === 0) return;
    setSummarizing(true);
    setDigestError(null);
    try {
      const text = await completeText(buildPrompt(emails));
      const next: StoredDigest = { text: text.trim(), date: todayKey(), lastAttempt: todayKey() };
      setDigest(next);
      localStorage.setItem('neko-gmail-digest', JSON.stringify(next));
    } catch (err: any) {
      setDigestError(err.message);
      const stored = readDigest();
      const next: StoredDigest = { ...(stored ?? { text: '', date: '' }), lastAttempt: todayKey() };
      localStorage.setItem('neko-gmail-digest', JSON.stringify(next));
    } finally {
      setSummarizing(false);
    }
  }, [activeProvider, summarizing, emails, completeText]);

  // Auto-summarize once per morning: first mount of a new day with unread mail
  useEffect(() => {
    const today = todayKey();
    if (
      !autoAttempted.current &&
      isConnected &&
      activeProvider &&
      emails.length > 0 &&
      digest?.date !== today &&
      digest?.lastAttempt !== today
    ) {
      autoAttempted.current = true;
      summarize();
    }
  }, [isConnected, activeProvider, emails, digest, summarize]);

  if (!enabled || (!isConnected && !wasConnected)) {
    return null;
  }

  const latest = emails[0];

  return (
    <div ref={rootRef} style={{ position: 'relative', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: 'var(--text-color)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          opacity: 0.8,
          maxWidth: '480px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        <Mail size={14} color="var(--accent-color)" />
        <span style={{ fontWeight: 500 }}>
          gmail{unreadCount > 0 ? ` — ${unreadCount} unread` : ' — inbox zero'}
        </span>
        {latest && (
          <>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {latest.subject}
            </span>
          </>
        )}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />
      </button>

      {error && (
        <span style={{ marginLeft: '8px', color: '#ff4444', fontSize: '0.78rem' }}>{error}</span>
      )}

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '36px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '520px',
            maxWidth: '90vw',
            maxHeight: '60vh',
            overflowY: 'auto',
            background: 'var(--bg-color, #111)',
            border: '1px solid rgba(128,128,128,0.35)',
            borderRadius: '6px',
            padding: '14px 16px',
            zIndex: 50,
            textAlign: 'left',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
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
                    <span style={{ opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', flexShrink: 0 }}>
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

          {(unreadCount > 0 || digest?.text) && (
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(128,128,128,0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.55, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={11} /> ai digest{digest?.date === todayKey() ? ' · today' : ''}
                </span>
                {!summarizing && unreadCount > 0 && (
                  <button
                    onClick={summarize}
                    disabled={!activeProvider}
                    title={activeProvider ? 'Regenerate AI summary' : 'Configure an AI provider in Settings → AI'}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--accent-color)',
                      fontSize: '0.75rem',
                      cursor: activeProvider ? 'pointer' : 'not-allowed',
                      opacity: activeProvider ? 0.8 : 0.4,
                    }}
                  >
                    {digest?.text ? 're-summarize' : 'summarize'}
                  </button>
                )}
              </div>
              {summarizing && (
                <span style={{ opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                  <RefreshCw size={11} /> summarizing…
                </span>
              )}
              {!summarizing && digest?.text && (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', opacity: 0.85, fontSize: '0.82rem' }}>{digest.text}</p>
              )}
              {!summarizing && !digest?.text && !digestError && activeProvider && unreadCount === 0 && null}
              {digestError && (
                <p style={{ margin: '4px 0 0', color: '#ff4444', fontSize: '0.78rem' }}>summary failed: {digestError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
