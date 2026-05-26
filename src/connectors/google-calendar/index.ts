import type { Connector } from '../types'
import { UpcomingEvent } from './UpcomingEvent'
import { GoogleCalendarSettings } from './settings'

export const googleCalendarConnector: Connector = {
  id: 'google-calendar',
  name: 'Google Calendar',
  description: 'See your next upcoming event directly on the new tab page',
  placement: 'center-widget',
  defaultConfig: {
    enabled: false,
    lookahead: 4320,
  },
  Widget: UpcomingEvent,
  SettingsWidget: GoogleCalendarSettings,
  oauth2ClientIdPlaceholder: '__GOOGLE_CLIENT_ID__',
  oauth2Scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
  manifestPermissions: ['identity'],
}
