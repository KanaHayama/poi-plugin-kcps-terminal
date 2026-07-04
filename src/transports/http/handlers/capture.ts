import type http from 'node:http'
import { captureFrame } from '../../../services/capture'
import type { CaptureFormat } from '../../../services/capture'
import { sendImage, sendServerError } from '../shared'

export const createCaptureHandler = (
  onError: (source: string, message: string) => void,
) => {
  return async (
    _req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
  ): Promise<void> => {
    try {
      // png is for debugging only; KCPS itself always requests jpeg
      const format: CaptureFormat = url.searchParams.get('format') === 'png' ? 'png' : 'jpeg'
      const frame = await captureFrame(format)
      sendImage(res, frame.buffer, frame.contentType)
    } catch (ex) {
      onError('/capture', (ex as Error).message)
      if (!res.headersSent) sendServerError(res)
    }
  }
}
