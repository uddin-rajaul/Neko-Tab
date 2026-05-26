import { Calendar } from 'lucide-react';
import { useGoogleCalendar } from './useGoogleCalendar';
import { useTime } from '../../hooks/useLocalStorage';
import { useSettings } from '../../hooks/useLocalStorage';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getConnectorConfig } from '../types';

const CONNECTOR_ID = 'google-calendar';

function calculateTimeRemaining(event: any | null, now: Date, lookaheadMins: number): string {
  if (!event) return '';

  const startStr = event.start.dateTime || event.start.date;
  if (!startStr) return '';

  const startTime = new Date(startStr).getTime();
  const nowTime = now.getTime();
  const diffMs = startTime - nowTime;

  if (diffMs > lookaheadMins * 60 * 1000) return '';

  if (diffMs <= 0) return 'now';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    const remainingMins = diffMins % 60;
    return remainingMins > 0
      ? `in ${diffHours}h ${remainingMins}m`
      : `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else {
    return `in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
  }
}

export function UpcomingEvent() {
  const [settings] = useSettings();
  const config = getConnectorConfig(settings, CONNECTOR_ID);
  const enabled = !!config.enabled;
  const lookahead = (config.lookahead as number) ?? 4320;

  const { event, isConnected, error } = useGoogleCalendar(enabled);
  const time = useTime();
  const [wasConnected] = useState(() => localStorage.getItem('neko-calendar-connected') === 'true');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const timeRemaining = calculateTimeRemaining(event, time, lookahead);

  useEffect(() => {
    if (error && enabled) {
      setToast(`Calendar: ${error}`);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    }
  }, [error, enabled]);

  if (!enabled || (!isConnected && !wasConnected)) {
    return null;
  }

  return (
    <>
      <div
        className="upcoming-event-wrapper"
        style={{
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto'
        }}
      >
        {(event && timeRemaining) && (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="upcoming-event-widget"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: 'var(--text-color)',
              textDecoration: 'none',
              cursor: 'pointer',
              opacity: 0.8
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
          >
            <Calendar size={14} color="var(--accent-color)" />
            <span style={{ fontWeight: 500 }}>{event.summary}</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ opacity: 0.8 }}>{timeRemaining}</span>
          </a>
        )}
      </div>

      {toast && createPortal(
        <div className="cp-toast">{toast}</div>,
        document.body
      )}
    </>
  );
}
