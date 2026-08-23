import { useGmail } from './useGmail';
import { isIdentityAvailable } from '../../utils/browser';

interface GmailSettingsProps {
  config: Record<string, unknown>
  onConfigChange: (patch: Record<string, unknown>) => void
}

export function GmailSettings({ config, onConfigChange }: GmailSettingsProps) {
  const { isConnected, connect, disconnect, error } = useGmail(false);
  const enabled = !!config.enabled;
  const isExt = isIdentityAvailable();

  return (
    <div className='saas-card'>
      <label className='saas-label'>Gmail</label>

      {!isExt && (
        <div className='saas-hint' style={{ color: '#ffb300', marginBottom: 16, border: '1px solid rgba(255, 179, 0, 0.2)', padding: '8px', borderRadius: '4px' }}>
          Identity API not detected. Please make sure this is running as a loaded extension in Chrome or Firefox.
        </div>
      )}

      <div className='saas-toggle-list' style={{ marginBottom: 12 }}>
        <div className="saas-toggle-row">
          <span className="saas-toggle-label">Show inbox digest on home page</span>
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

      {!isConnected ? (
        <div>
          <p className='saas-hint' style={{ marginBottom: 12 }}>
            Connect your Google account to see unread email and an AI-powered summary. Google will ask for read-only Gmail access on first connect.
          </p>
          <button className='saas-btn-primary' onClick={connect}>
            Connect Gmail
          </button>
        </div>
      ) : (
        <div>
          <p className='saas-hint' style={{ marginBottom: 12, color: 'var(--accent-color)' }}>✓ Connected to Gmail</p>
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
