import React from 'react'
import { Button, Pre } from '@blueprintjs/core'
import type { ErrorEntry } from '../stores'
import { __ } from '../constants'

interface ErrorLogProps {
  errors: ErrorEntry[]
  onClear: () => void
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour12: false })
}

export const ErrorLog: React.FC<ErrorLogProps> = ({ errors, onClear }) => {
  if (errors.length === 0) return null

  return (
    <div className="kcps-error-log">
      <div className="kcps-error-log-header">
        <span>{__('Error Log')} ({errors.length})</span>
        <Button icon="trash" minimal small onClick={onClear} />
      </div>
      <Pre className="kcps-error-log-content">
        {errors.map(entry => (
          <div key={entry.id} className="kcps-error-entry">
            <span className="kcps-error-time">{formatTime(entry.time)}</span>
            {' '}
            <span className="kcps-error-source">[{entry.source}]</span>
            {' '}
            <span className="kcps-error-message">{entry.message}</span>
          </div>
        ))}
      </Pre>
    </div>
  )
}
