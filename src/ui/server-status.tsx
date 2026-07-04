import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Tag, Intent } from '@blueprintjs/core'
import { clipboard } from 'electron'
import type { ServerStatus } from '../transports/http/server'
import { __ } from '../constants'

interface ServerStatusProps {
  status: ServerStatus
  /** Full /capture URL (including token) while the server is running, otherwise null */
  captureUrl: string | null
}

export const ServerStatusDisplay: React.FC<ServerStatusProps> = ({ status, captureUrl }) => {
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  const handleCopy = useCallback(() => {
    if (!captureUrl) return
    clipboard.writeText(captureUrl)
    setCopied(true)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1500)
  }, [captureUrl])

  let intent: Intent
  let text: string

  switch (status.state) {
    case 'running':
      intent = Intent.SUCCESS
      text = `${__('Running on port')} ${status.port}`
      break
    case 'error':
      intent = Intent.DANGER
      text = `${__('Error')}: ${status.error ?? __('Unknown')}`
      break
    case 'stopped':
    default:
      intent = Intent.NONE
      text = __('Stopped')
      break
  }

  return (
    <div className="kcps-server-status">
      <Tag intent={intent} round minimal large icon={status.state === 'running' ? 'dot' : 'disable'}>
        {text}
      </Tag>
      {captureUrl && (
        <span className="kcps-capture-link">
          <a href={captureUrl} target="_blank" rel="noreferrer">
            {`http://127.0.0.1:${status.port}/capture`}
          </a>
          <Button
            icon={copied ? 'tick' : 'clipboard'}
            minimal
            small
            title={__('Copy link')}
            onClick={handleCopy}
          />
        </span>
      )}
    </div>
  )
}
