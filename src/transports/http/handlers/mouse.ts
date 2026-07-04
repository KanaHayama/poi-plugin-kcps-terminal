import type http from 'node:http'
import { toNumber } from 'lodash'
import { sendMouse, isMouseEventType } from '../../../services/mouse'
import { sendBadRequest, sendServerError } from '../shared'

export const createMouseHandler = (
  onError: (source: string, message: string) => void,
) => {
  return (
    _req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
  ): void => {
    const xParam = url.searchParams.get('x')
    const yParam = url.searchParams.get('y')
    const type = url.searchParams.get('type')

    // Missing params must be rejected before conversion: toNumber(null) is 0,
    // which would otherwise pass the range check and click at (0, 0)
    if (!xParam || !yParam || !type || !isMouseEventType(type)) {
      sendBadRequest(res)
      return
    }

    const xRaw = toNumber(xParam)
    const yRaw = toNumber(yParam)
    if (!(xRaw >= 0 && xRaw <= 1 && yRaw >= 0 && yRaw <= 1)) {
      sendBadRequest(res)
      return
    }

    try {
      if (!sendMouse(type, xRaw, yRaw)) {
        // webview not ready
        sendServerError(res)
        return
      }
      res.statusCode = 200
      res.end()
    } catch (ex) {
      onError('/mouse', (ex as Error).message)
      if (!res.headersSent) sendServerError(res)
    }
  }
}
