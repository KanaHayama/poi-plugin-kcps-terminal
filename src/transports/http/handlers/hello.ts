import type http from 'node:http'
import { sendText } from '../shared'

export const helloHandler = (
  _req: http.IncomingMessage,
  res: http.ServerResponse,
  _url: URL,
): void => {
  sendText(res, 'Hello World')
}
