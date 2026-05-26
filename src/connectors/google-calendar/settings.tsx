import { useGoogleCalendar } from './useGoogleCalendar';

interface CalendarSettingsProps {
  config: Record<string, unknown>
  onConfigChange: (patch: Record<string, unknown>) => void
}

export function GoogleCalendarSettings({ config, onConfigChange }: CalendarSettingsProps) {
  const { isConnected, connect, disconnect, error } = useGoogleCalendar(false);
  const enabled = !!config.enabled;
  const lookahead = (config.lookahead as number) ?? 4320;
  const isExtension = typeof chrome !== 'undefined' && !!chrome.identity;

  return (
    <div className='saas-card'>
      <label className='saas-label'>Google Calendar</label>

      {!isExtension && (
        <div className='saas-hint' style={{ color: '#ffb300', marginBottom: 16, border: '1px solid rgba(255, 179, 0, 0.2)', padding: '8px', borderRadius: '4px' }}>
          Identity API not detected. Please make sure this is running as a loaded extension in Chrome.
        </div>
      )}

      <div className='saas-toggle-list' style={{ marginBottom: 12 }}>
        <div className="saas-toggle-row">
          <span className="saas-toggle-label">Show upcoming event on home page</span>
          <button
            className={`saas-toggle-btn ${enabled ? 'active' : ''}`}
            onClick={() => onConfigChange({ enabled: !enabled })}
            disabled={!isConnected}
            style={{ opacity: !isConnected ? 0.5 : 1, cursor: !isConnected ? 'not-allowed' : 'pointer' }}
          >
            <div className="saas-toggle-thumb" />
          </button>
        </div>
      </div>

      {isConnected && (
        <div className='saas-flex-row' style={{ marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="saas-label" style={{ margin: 0 }}>Show events within:</span>
          <select
            className='saas-input'
            style={{ width: 'auto', padding: '4px 8px', height: '32px' }}
            value={lookahead}
            onChange={(e) => onConfigChange({ lookahead: Number(e.target.value) })}
          >
            <option value={60}>1 hour</option>
            <option value={360}>6 hours</option>
            <option value={4320}>3 days</option>
            <option value={10080}>7 days</option>
            <option value={14400}>10 days</option>
          </select>
        </div>
      )}

      {!isConnected ? (
        <div>
          <p className='saas-hint' style={{ marginBottom: 12 }}>Connect your Google account to see your next upcoming event.</p>
          <button className='saas-btn-primary' onClick={connect}>
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div>
          <p className='saas-hint' style={{ marginBottom: 12, color: 'var(--accent-color)' }}>✓ Connected to Google Calendar</p>
          <button className='saas-btn-secondary' onClick={disconnect}>
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <p className='saas-hint' style={{ marginTop: 12, color: '#ff4444' }}>Error: {error}</p>
      )}
    </div>
  );
}
