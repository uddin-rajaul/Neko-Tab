import type { ComponentType } from 'react'
import type { Settings } from '../types'

export type ConnectorPlacement = 'center-widget'

export interface Connector {
  id: string
  name: string
  description: string
  placement: ConnectorPlacement | ConnectorPlacement[]
  defaultConfig: Record<string, unknown>
  Widget?: ComponentType
  SettingsWidget?: ComponentType<{
    config: Record<string, unknown>
    onConfigChange: (patch: Record<string, unknown>) => void
  }>
  /** If this connector uses chrome.identity.getAuthToken (Google-specific OAuth) */
  oauth2ClientIdPlaceholder?: string
  oauth2Scopes?: string[]
  manifestPermissions?: string[]
}

export function getConnectorConfig(settings: Settings, connectorId: string) {
  return (settings.connectors?.[connectorId] ?? {}) as Record<string, unknown>
}

export function updateConnectorConfig(
  settings: Settings,
  connectorId: string,
  patch: Record<string, unknown>
): Settings {
  return {
    ...settings,
    connectors: {
      ...settings.connectors,
      [connectorId]: {
        ...(settings.connectors?.[connectorId] ?? {}),
        ...patch,
      },
    },
  }
}
