import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../../hooks/useLocalStorage';
import { getAuthToken, removeCachedAuthToken } from '../../utils/browser';

export interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  snippet: string;
}

interface GmailCache {
  emails: GmailEmail[];
  unreadCount: number;
}

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

function readCache(): GmailCache {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.GMAIL_LAST_EMAILS);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore corrupt cache */ }
  return { emails: [], unreadCount: 0 };
}

function header(msg: any, name: string): string {
  const found = msg?.payload?.headers?.find(
    (h: any) => h.name.toLowerCase() === name.toLowerCase()
  );
  return found?.value ?? '';
}

function shortFrom(from: string): string {
  const match = from.match(/"?([^"<]*)"?\s*<(.+)>/);
  const name = match ? (match[1] || match[2]) : from;
  return name.trim();
}

async function fetchUnread(token: string): Promise<GmailCache> {
  // Unread count via resultSizeEstimate
  const countUrl = `${GMAIL_API}/messages?q=${encodeURIComponent('is:unread')}&maxResults=1`;
  const countRes = await fetch(countUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!countRes.ok) throw new Error(`Gmail API error: ${countRes.status}`);
  const countData = await countRes.json();
  const unreadCount = countData.resultSizeEstimate ?? 0;

  if (unreadCount === 0) return { emails: [], unreadCount: 0 };

  // Latest unread emails with metadata
  const listUrl = `${GMAIL_API}/messages?q=${encodeURIComponent('is:unread')}&maxResults=8`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!listRes.ok) throw new Error(`Gmail API error: ${listRes.status}`);
  const listData = await listRes.json();
  const ids: { id: string }[] = listData.messages ?? [];

  const emails = await Promise.all(
    ids.map(async ({ id }) => {
      const msgUrl = `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`;
      const msgRes = await fetch(msgUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!msgRes.ok) throw new Error(`Gmail API error: ${msgRes.status}`);
      const msg = await msgRes.json();
      return {
        id,
        subject: header(msg, 'Subject') || '(no subject)',
        from: shortFrom(header(msg, 'From')),
        snippet: msg.snippet ?? '',
      };
    })
  );

  return { emails, unreadCount };
}

export function useGmail(fetchEnabled: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [cache, setCache] = useState<GmailCache>(readCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAuthToken(false).then((authToken) => {
      if (!isMounted) return;
      if (authToken) {
        setToken(authToken);
        localStorage.setItem(STORAGE_KEYS.GMAIL_CONNECTED, 'true');
      }
    });
    return () => { isMounted = false; };
  }, []);

  const connect = useCallback(() => {
    getAuthToken(true).then((authToken) => {
      if (authToken) {
        setToken(authToken);
        localStorage.setItem(STORAGE_KEYS.GMAIL_CONNECTED, 'true');
        setError(null);
      } else {
        setError('Auth failed');
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    if (!token) return;
    removeCachedAuthToken(token).then(() => {
      setToken(null);
      setCache({ emails: [], unreadCount: 0 });
      localStorage.setItem(STORAGE_KEYS.GMAIL_CONNECTED, 'false');
      localStorage.removeItem(STORAGE_KEYS.GMAIL_LAST_EMAILS);
    });
  }, [token]);

  useEffect(() => {
    if (!fetchEnabled || !token) return;

    let isMounted = true;
    let timeoutId: number;

    const refresh = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchUnread(token);
        if (!isMounted) return;
        setCache(next);
        localStorage.setItem(STORAGE_KEYS.GMAIL_LAST_EMAILS, JSON.stringify(next));
      } catch (err: any) {
        if (!isMounted) return;
        if (err.message?.includes('401')) {
          // Token expired — clear cache and re-auth interactively on next connect
          removeCachedAuthToken(token).then(() => {
            if (!isMounted) return;
            setToken(null);
          });
        }
        setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }

      if (isMounted) {
        timeoutId = window.setTimeout(refresh, 5 * 60 * 1000);
      }
    };

    refresh();

    return () => {
      isMounted = false;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [token, fetchEnabled]);

  return {
    token,
    isConnected: !!token,
    connect,
    disconnect,
    emails: cache.emails,
    unreadCount: cache.unreadCount,
    loading,
    error,
  };
}
