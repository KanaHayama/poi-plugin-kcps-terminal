const getStore = (path?: string): unknown => window.getStore(path)

export interface WebviewDimensions {
  width: number
  height: number
}

export interface CaptureRect {
  x: number
  y: number
  width: number
  height: number
}

export const getWebviewRef = (): Record<string, (...args: unknown[]) => unknown> | null => {
  const ref = getStore('layout.webview.ref') as Record<string, (...args: unknown[]) => unknown> | null
  return ref ?? null
}

export const getWebviewDimensions = (): WebviewDimensions => {
  const layout = getStore('layout.webview') as {
    width: number
    height: number
    windowWidth: number
    windowHeight: number
  }
  const isolate = window.config.get('poi.isolateGameWindow', false) as boolean
  return {
    width: isolate ? layout.windowWidth : layout.width,
    height: isolate ? layout.windowHeight : layout.height,
  }
}

export const captureWebview = async (rect: CaptureRect): Promise<{
  toPNG: () => Buffer
  toJPEG: (quality: number) => Buffer
  getSize: () => { width: number; height: number }
  resize: (options: { width: number }) => unknown
}> => {
  const ref = getWebviewRef()
  if (!ref) throw new Error('Webview ref not available')
  const image = await (ref.capturePage as (rect: CaptureRect) => Promise<unknown>)(rect)
  return image as {
    toPNG: () => Buffer
    toJPEG: (quality: number) => Buffer
    getSize: () => { width: number; height: number }
    resize: (options: { width: number }) => unknown
  }
}

export interface MouseInputEvent {
  type: string
  x: number
  y: number
  globalX: number
  globalY: number
  button?: string
  clickCount?: number
}

export const sendInputToWebview = (event: MouseInputEvent): void => {
  const ref = getWebviewRef()
  if (!ref) throw new Error('Webview ref not available')
  ;(ref.sendInputEvent as (event: MouseInputEvent) => void)(event)
}
