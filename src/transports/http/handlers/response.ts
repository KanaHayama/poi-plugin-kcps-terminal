import type http from 'node:http'
import type { RouteDependencies } from '../shared'
import { sendJson } from '../shared'

export const createResponseHandler = (deps: RouteDependencies) => {
  return (
    _req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
  ): void => {
    const storage = deps.eventHandler.getResponseStorage()
    const type = url.searchParams.get('type')?.trim()

    if (!type) {
      // Debug: return all stored responses sorted by key
      const sorted = Object.keys(storage).sort().reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = storage[key]
        return acc
      }, {})
      sendJson(res, sorted)
    } else {
      const data = storage[type]
      if (data === undefined) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end('null')
      } else {
        sendJson(res, data)
      }
    }
  }
}
