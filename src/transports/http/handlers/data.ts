import type http from 'node:http'
import { getGameData } from '../../../services/game-data'
import type { RouteDependencies } from '../shared'
import { sendJson, sendBadRequest } from '../shared'

export const createDataHandler = (deps: RouteDependencies) => {
  return (
    _req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
  ): void => {
    const type = url.searchParams.get('type')
    if (!type) {
      sendBadRequest(res)
      return
    }

    const result = getGameData(type, deps.gameState)
    if (!result.ok) {
      sendBadRequest(res)
      return
    }

    if (result.value === undefined) {
      console.warn('[KCPS] Got "undefined" when querying data of type "%s"', type)
    }

    sendJson(res, result.value)
  }
}
