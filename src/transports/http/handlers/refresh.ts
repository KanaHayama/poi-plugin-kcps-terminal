import type http from 'node:http'
import { refreshGame } from '../../../services/refresh'

export const refreshHandler = (
  _req: http.IncomingMessage,
  res: http.ServerResponse,
  _url: URL,
): void => {
  refreshGame()
  res.statusCode = 200
  res.end()
}
