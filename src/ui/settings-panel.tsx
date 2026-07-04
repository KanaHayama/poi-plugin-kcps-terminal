import React, { useCallback, useEffect, useState } from 'react'
import { NumericInput, InputGroup, Button, Slider } from '@blueprintjs/core'
import {
  CONFIG_PATH_PORT, CONFIG_PATH_TOKEN, CONFIG_PATH_ZOOM, CONFIG_PATH_QUALITY,
  MIN_PORT, MAX_PORT, MIN_ZOOM, MAX_ZOOM, MIN_QUALITY, MAX_QUALITY, __,
} from '../constants'
import type { KcpsTerminalConfig } from '../utils/selectors'

interface CommittedNumericInputProps {
  value: number
  min: number
  max: number
  integer?: boolean
  stepSize?: number
  minorStepSize?: number | null
  onCommit: (value: number) => void
}

/**
 * NumericInput that only commits on blur / Enter / spinner buttons.
 * Committing per keystroke is not acceptable for the port field:
 * typing "8080" would restart the server on ports 8, 80 and 808.
 */
const CommittedNumericInput: React.FC<CommittedNumericInputProps> = ({
  value, min, max, integer = false, stepSize, minorStepSize = null, onCommit,
}) => {
  const [text, setText] = useState(String(value))
  const [editing, setEditing] = useState(false)

  // Reflect external config changes while not editing
  useEffect(() => {
    if (!editing) setText(String(value))
  }, [value, editing])

  const commit = useCallback((raw: string) => {
    const num = Number(raw)
    const valid = Number.isFinite(num)
      && num >= min && num <= max
      && (!integer || Number.isInteger(num))
    if (valid && num !== value) onCommit(num)
    setText(String(valid ? num : value))
  }, [min, max, integer, onCommit, value])

  const handleValueChange = useCallback((_num: number, str: string) => setText(str), [])

  const handleButtonClick = useCallback((num: number, str: string) => {
    setText(str)
    if (num !== value) onCommit(num)
  }, [onCommit, value])

  const handleFocus = useCallback(() => setEditing(true), [])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setEditing(false)
    commit(e.target.value)
  }, [commit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
  }, [commit])

  return (
    <NumericInput
      fill
      value={text}
      min={min}
      max={max}
      stepSize={stepSize}
      minorStepSize={minorStepSize}
      onValueChange={handleValueChange}
      onButtonClick={handleButtonClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
}

interface SettingsPanelProps {
  config: KcpsTerminalConfig
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config: cfg }) => {
  const [showToken, setShowToken] = useState(false)
  const [qualityDraft, setQualityDraft] = useState<number | null>(null)

  const handlePortCommit = useCallback((value: number) => {
    window.config.set(CONFIG_PATH_PORT, value)
  }, [])

  const handleTokenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    window.config.set(CONFIG_PATH_TOKEN, e.target.value.trim())
  }, [])

  const handleGenerateToken = useCallback(() => {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    const token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    window.config.set(CONFIG_PATH_TOKEN, token)
    setShowToken(true)
  }, [])

  const handleZoomCommit = useCallback((value: number) => {
    window.config.set(CONFIG_PATH_ZOOM, value)
  }, [])

  const handleQualityRelease = useCallback((value: number) => {
    setQualityDraft(null)
    window.config.set(CONFIG_PATH_QUALITY, value)
  }, [])

  const toggleTokenVisibility = useCallback(() => {
    setShowToken(prev => !prev)
  }, [])

  // Layout is a plain CSS grid (label column + control column) instead of
  // Blueprint FormGroup, so it stays stable across Blueprint versions and
  // whatever global styles poi applies
  return (
    <div className="kcps-settings">
      <span className="kcps-label">{`${__('Port')} (${MIN_PORT}–${MAX_PORT})`}</span>
      <div className="kcps-control">
        <CommittedNumericInput
          value={cfg.port}
          min={MIN_PORT}
          max={MAX_PORT}
          integer
          stepSize={1}
          onCommit={handlePortCommit}
        />
      </div>

      <span className="kcps-label">{__('Token')}</span>
      <div className="kcps-control">
        <InputGroup
          fill
          value={cfg.token}
          onChange={handleTokenChange}
          type={showToken ? 'text' : 'password'}
          placeholder={`(${__('none')})`}
          rightElement={
            <>
              <Button
                icon={showToken ? 'eye-off' : 'eye-open'}
                minimal
                title={__('Toggle token visibility')}
                onClick={toggleTokenVisibility}
              />
              <Button
                icon="random"
                minimal
                title={__('Generate random token')}
                onClick={handleGenerateToken}
              />
            </>
          }
        />
      </div>

      <span className="kcps-label">{`${__('Zoom')} (${MIN_ZOOM}–${MAX_ZOOM})`}</span>
      <div className="kcps-control">
        <CommittedNumericInput
          value={cfg.zoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          stepSize={0.25}
          minorStepSize={0.05}
          onCommit={handleZoomCommit}
        />
      </div>

      <span className="kcps-label">{__('JPEG Quality')}</span>
      <div className="kcps-control kcps-control-slider">
        <Slider
          min={MIN_QUALITY}
          max={MAX_QUALITY}
          stepSize={1}
          labelStepSize={25}
          value={qualityDraft ?? cfg.quality}
          onChange={setQualityDraft}
          onRelease={handleQualityRelease}
        />
      </div>
    </div>
  )
}
