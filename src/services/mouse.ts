import { toInteger, round } from 'lodash'
import { getWebviewDimensions, sendInputToWebview } from '../utils/webview'
import type { MouseInputEvent } from '../utils/webview'

export type MouseEventType = 'down' | 'up' | 'move' | 'enter' | 'leave'

const MOUSE_EVENT_TYPES: readonly string[] = ['down', 'up', 'move', 'enter', 'leave']

export const isMouseEventType = (value: string): value is MouseEventType =>
  MOUSE_EVENT_TYPES.includes(value)

/**
 * Sends a mouse event to the game webview.
 * x/y are normalized to [0, 1] relative to the game area.
 * Returns false when the webview has no size yet (not ready).
 */
export const sendMouse = (type: MouseEventType, xNorm: number, yNorm: number): boolean => {
  const { width: scWidth, height: scHeight } = getWebviewDimensions()
  if (scWidth <= 0) {
    return false
  }

  // poi's appearance zoom keeps the rendered size unchanged,
  // but actual input coordinates must be multiplied by it
  const zoom = window.config.get('poi.appearance.zoom', 1) as number
  const x = toInteger(round(xNorm * scWidth * zoom))
  const y = toInteger(round(yNorm * scHeight * zoom))

  let event: MouseInputEvent
  switch (type) {
    case 'down':
      event = { type: 'mouseDown', x, y, globalX: x, globalY: y, button: 'left', clickCount: 1 }
      break
    case 'up':
      event = { type: 'mouseUp', x, y, globalX: x, globalY: y, button: 'left', clickCount: 1 }
      break
    case 'move':
      event = { type: 'mouseMove', x, y, globalX: x, globalY: y }
      break
    case 'enter':
      event = { type: 'mouseEnter', x, y, globalX: x, globalY: y }
      break
    case 'leave':
      event = { type: 'mouseLeave', x, y, globalX: x, globalY: y }
      break
  }

  sendInputToWebview(event)
  return true
}
