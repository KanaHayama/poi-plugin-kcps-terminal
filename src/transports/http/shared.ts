import type http from 'node:http'
import type { GameEventHandler } from '../../state/game-event-handler'
import type { GameStateManager } from '../../state/game-state'

export type RouteHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
) => void | Promise<void>

export interface RouteDependencies {
  eventHandler: GameEventHandler
  gameState: GameStateManager
}

// Response helpers
export const sendText = (res: http.ServerResponse, text: string, statusCode = 200): void => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(text)
}

export const sendJson = (res: http.ServerResponse, data: unknown, statusCode = 200): void => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // JSON does not support undefined, replace it with null
  const jsonStr = JSON.stringify(data, (_k, v: unknown) => v === undefined ? null : v)
  res.end(jsonStr)
}

export const sendImage = (res: http.ServerResponse, buffer: Buffer, contentType: string): void => {
  res.statusCode = 200
  res.setHeader('Content-Type', contentType)
  res.end(buffer)
}

export const sendBadRequest = (res: http.ServerResponse): void => {
  res.statusCode = 400
  res.end()
}

export const sendForbidden = (res: http.ServerResponse): void => {
  res.statusCode = 403
  res.end()
}

export const sendNotFound = (res: http.ServerResponse): void => {
  res.statusCode = 404
  res.end()
}

export const sendServerError = (res: http.ServerResponse): void => {
  res.statusCode = 500
  res.end()
}
