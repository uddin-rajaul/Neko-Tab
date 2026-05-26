import type { ComponentType } from 'react'
import type { Connector } from './types'
import { updateConnectorConfig } from './types'
import { googleCalendarConnector } from './google-calendar'
export { updateConnectorConfig }

const connectors: Connector[] = [
  googleCalendarConnector,
]

interface ConnectorWithWidget extends Connector {
  Widget: ComponentType
}

interface ConnectorWithSettings extends Connector {
  SettingsWidget: ComponentType<{
    config: Record<string, unknown>
    onConfigChange: (patch: Record<string, unknown>) => void
  }>
}

export function getConnectors() {
  return connectors
}

export function getConnector(id: string) {
  return connectors.find(c => c.id === id) ?? null
}

export function getConnectorsWithWidget(): ConnectorWithWidget[] {
  return connectors.filter((c): c is ConnectorWithWidget => !!c.Widget)
}

export function getConnectorsWithSettings(): ConnectorWithSettings[] {
  return connectors.filter((c): c is ConnectorWithSettings => !!c.SettingsWidget)
}

export function hasActiveCenterWidgets(settings: { connectors?: Record<string, Record<string, unknown>> }) {
  return getConnectorsWithWidget().some(conn => {
    const config = settings.connectors?.[conn.id]
    return config && !!config.enabled
  })
}
