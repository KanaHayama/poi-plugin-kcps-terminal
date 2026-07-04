import React from 'react'
import { useSelector } from 'react-redux'
import { kcpsTerminalConfigSelector } from '../utils/selectors'
import { serverStatusStore, errorLogStore, clearErrors } from '../stores'
import { useObservable } from '../utils/observable'
import { ServerStatusDisplay } from './server-status'
import { SettingsPanel } from './settings-panel'
import { ErrorLog } from './error-log'
import { STYLES } from './styles'

export const PluginRoot: React.FC = () => {
  const cfg = useSelector(kcpsTerminalConfigSelector)
  const serverStatus = useObservable(serverStatusStore)
  const errors = useObservable(errorLogStore)

  // Test link shown while running; the README install check uses this URL
  const captureUrl = serverStatus.state === 'running'
    ? `http://127.0.0.1:${serverStatus.port}/capture${cfg.token ? `?token=${encodeURIComponent(cfg.token)}` : ''}`
    : null

  return (
    <div id="kcps-terminal" className="kcps-terminal-wrapper">
      <style>{STYLES}</style>
      <ServerStatusDisplay status={serverStatus} captureUrl={captureUrl} />
      <SettingsPanel config={cfg} />
      <ErrorLog errors={errors} onClear={clearErrors} />
    </div>
  )
}
