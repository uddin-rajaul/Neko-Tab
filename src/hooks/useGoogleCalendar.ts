import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from './useLocalStorage';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string; // For all-day events
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
}

export function useGoogleCalendar(fetchEnabled: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [event, setEvent] = useState<CalendarEvent | null>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CALENDAR_LAST_EVENT);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always check for an existing token on mount to determine connection status
  useEffect(() => {
    if (!chrome.identity) return;

    chrome.identity.getAuthToken({ interactive: false }, (authToken) => {
      if (chrome.runtime.lastError) {
        localStorage.setItem(STORAGE_KEYS.CALENDAR_CONNECTED, 'false');
        return;
      }
      if (authToken) {
        setToken(authToken as string);
        localStorage.setItem(STORAGE_KEYS.CALENDAR_CONNECTED, 'true');
      }
    });
  }, []);

  // Method to manually connect (interactive)
  const connect = useCallback(() => {
    if (!chrome.identity) return;
    chrome.identity.getAuthToken({ interactive: true }, (authToken) => {
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message || 'Auth failed');
        return;
      }
      if (authToken) {
        setToken(authToken as string);
        localStorage.setItem(STORAGE_KEYS.CALENDAR_CONNECTED, 'true');
        setError(null);
      }
    });
  }, []);

  // Method to disconnect
  const disconnect = useCallback(() => {
    if (!chrome.identity || !token) return;
    chrome.identity.removeCachedAuthToken({ token }, () => {
      setToken(null);
      setEvent(null);
      localStorage.setItem(STORAGE_KEYS.CALENDAR_CONNECTED, 'false');
      localStorage.removeItem(STORAGE_KEYS.CALENDAR_LAST_EVENT);
    });
  }, [token]);

  // Fetch upcoming event when token is available and fetching is enabled
  useEffect(() => {
    if (!fetchEnabled) {
      // If we're not supposed to fetch, we don't clear the event 
      // (to preserve cache on home page if enabled is toggled)
      return;
    }
    
    if (!token) return;

    let isMounted = true;
    let timeoutId: number;

    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const timeMin = new Date().toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=1&singleEvents=true&orderBy=startTime`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            if (isMounted) setToken(null);
          });
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || `Failed to fetch events: ${response.status}`);
        }

        if (isMounted) {
          const newEvent = data.items?.[0] || null;
          setEvent(newEvent);
          if (newEvent) {
            localStorage.setItem(STORAGE_KEYS.CALENDAR_LAST_EVENT, JSON.stringify(newEvent));
          } else {
            localStorage.removeItem(STORAGE_KEYS.CALENDAR_LAST_EVENT);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Refetch every 5 minutes
      if (isMounted) {
        timeoutId = window.setTimeout(fetchEvent, 5 * 60 * 1000);
      }
    };

    fetchEvent();

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
    event,
    loading,
    error
  };
}
