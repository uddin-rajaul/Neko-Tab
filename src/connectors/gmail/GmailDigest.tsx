import { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Sparkles, RefreshCw } from 'lucide-react';
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
  const autoAttempted = useRef(false);

  const { loadProviders, completeText, activeProvider } = useAIProviders();

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

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

  return (
    <div
      className="gmail-digest-widget"
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '12px 16px',
        border: '1px solid var(--border-color, rgba(128,128,128,0.3))',
        borderRadius: '6px',
        fontSize: '0.85rem',
      }}
    >
      <a
        href={GMAIL_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-color)',
          textDecoration: 'none',
          opacity: 0.9,
        }}
      >
        <Mail size={14} color="var(--accent-color)" />
        <span style={{ fontWeight: 500 }}>
          gmail{unreadCount > 0 ? ` — ${unreadCount} unread` : ' — inbox zero'}
        </span>
      </a>

      {emails.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
          {emails.slice(0, 5).map((email) => (
            <li key={email.id} style={{ display: 'flex', gap: '8px', lineHeight: 1.6 }}>
              <span style={{ opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {email.from}
              </span>
              <a
                href={GMAIL_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--text-color)', textDecoration: 'none', opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={email.subject}
              >
                {email.subject}
              </a>
            </li>
          ))}
        </ul>
      )}

      {(digest?.text || summarizing || digestError || unreadCount > 0) && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color, rgba(128,128,128,0.3))' }}>
          {summarizing && (
            <span style={{ opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={12} /> summarizing…
            </span>
          )}
          {!summarizing && digest?.text && (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', opacity: 0.85 }}>{digest.text}</p>
          )}
          {digestError && (
            <p style={{ margin: 0, color: '#ff4444', fontSize: '0.8rem' }}>summary failed: {digestError}</p>
          )}
          {!summarizing && unreadCount > 0 && (
            <button
              onClick={summarize}
              disabled={!activeProvider}
              title={activeProvider ? 'Regenerate AI summary' : 'Configure an AI provider in Settings → AI'}
              style={{
                marginTop: '6px',
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--accent-color)',
                fontSize: '0.8rem',
                cursor: activeProvider ? 'pointer' : 'not-allowed',
                opacity: activeProvider ? 0.8 : 0.4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} />
              {digest?.text ? 're-summarize' : 'ai summary'}
            </button>
          )}
        </div>
      )}

      {error && (
        <p style={{ margin: '8px 0 0', color: '#ff4444', fontSize: '0.8rem' }}>gmail: {error}</p>
      )}
    </div>
  );
}
