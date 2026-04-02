import { Calendar } from 'lucide-react';
import { useGoogleCalendar, type CalendarEvent } from '../hooks/useGoogleCalendar';
import { useTime, useLocalStorage, STORAGE_KEYS } from '../hooks/useLocalStorage';

interface UpcomingEventProps {
  enabled: boolean;
}

function calculateTimeRemaining(event: CalendarEvent | null, now: Date): string {
  if (!event) return '';
  
  const startStr = event.start.dateTime || event.start.date;
  if (!startStr) return '';

  const startTime = new Date(startStr).getTime();
  const nowTime = now.getTime();
  const diffMs = startTime - nowTime;

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

export function UpcomingEvent({ enabled }: UpcomingEventProps) {
  const { event, isConnected } = useGoogleCalendar(enabled);
  const time = useTime();
  const [wasConnected] = useLocalStorage(STORAGE_KEYS.CALENDAR_CONNECTED, 'false');
  
  const timeRemaining = calculateTimeRemaining(event, time);

  // Use the localStorage hint to decide whether to reserve space before the token is confirmed
  if (!enabled || (!isConnected && wasConnected !== 'true')) {
    return null;
  }

  return (
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
      {event && (
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
  );
}
