import { toInteger, round } from 'lodash'
import {
  CONFIG_PATH_QUALITY, CONFIG_PATH_ZOOM,
  DEFAULT_QUALITY, DEFAULT_ZOOM, ORIGINAL_GRAPHIC_AREA_WIDTH,
} from '../constants'
import { captureWebview, getWebviewDimensions } from '../utils/webview'

export type CaptureFormat = 'jpeg' | 'png'

export interface CapturedFrame {
  buffer: Buffer
  contentType: string
}

/**
 * Captures the current game area, scaled to the configured zoom
 * (relative to the original 1200px-wide graphic area).
 * Transport-agnostic: HTTP handlers and future streaming transports
 * share this implementation.
 */
export const captureFrame = async (format: CaptureFormat = 'jpeg'): Promise<CapturedFrame> => {
  const { width: scWidth, height: scHeight } = getWebviewDimensions()
  const rect = {
    x: 0,
    y: 0,
    width: Math.floor(scWidth * devicePixelRatio),
    height: Math.floor(scHeight * devicePixelRatio),
  }

  let image = await captureWebview(rect)

  const quality = window.config.get(CONFIG_PATH_QUALITY, DEFAULT_QUALITY) as number
  const zoom = window.config.get(CONFIG_PATH_ZOOM, DEFAULT_ZOOM) as number
  const zoomWidth = toInteger(round(zoom * ORIGINAL_GRAPHIC_AREA_WIDTH))

  if (image.getSize().width !== zoomWidth) {
    image = image.resize({ width: zoomWidth }) as typeof image
  }

  return format === 'png'
    ? { buffer: image.toPNG(), contentType: 'image/png' }
    : { buffer: image.toJPEG(quality), contentType: 'image/jpeg' }
}
