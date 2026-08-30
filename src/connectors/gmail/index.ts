import type { Connector } from '../types'
import { GmailSettings } from './settings'

export const gmailConnector: Connector = {
  id: 'gmail',
  name: 'Gmail',
  description: 'See your unread email count and get an AI-powered inbox summary',
  placement: 'center-widget',
  defaultConfig: {
    enabled: false,
    showAISummary: true,
  },
  SettingsWidget: GmailSettings,
  oauth2Scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  manifestPermissions: ['identity'],
}
