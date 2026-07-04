import type { GameStateManager } from './game-state'

export interface GameEventDetail {
  method?: string
  path: string
  body: Record<string, unknown>
  postBody?: Record<string, unknown>
}

export type GameResponseListener = (detail: GameEventDetail) => void

export class GameEventHandler {
  private requestStorage: Record<string, unknown> = {}
  private responseStorage: Record<string, unknown> = {}
  private lastRequest: { body: Record<string, unknown> } | null = null
  private responseListeners = new Set<GameResponseListener>()
  private gameState: GameStateManager
  private onError: (source: string, message: string) => void

  constructor(gameState: GameStateManager, onError: (source: string, message: string) => void) {
    this.gameState = gameState
    this.onError = onError
  }

  /**
   * Subscribe to raw game responses. No consumer yet in the HTTP transport
   * (clients poll /response); future streaming transports push these
   * events to the client instead.
   */
  onResponse(listener: GameResponseListener): () => void {
    this.responseListeners.add(listener)
    return () => {
      this.responseListeners.delete(listener)
    }
  }

  handleRequest = (e: Event): void => {
    try {
      const detail = (e as CustomEvent<GameEventDetail>).detail
      this.lastRequest = { body: detail.body }
      const { path, body } = detail
      this.requestStorage[path] = body
    } catch (ex) {
      console.error('[KCPS] game.request:', ex)
      this.onError('game.request', (ex as Error).message)
    }
  }

  handleResponse = (e: Event): void => {
    try {
      const detail = (e as CustomEvent<GameEventDetail>).detail
      const { path, body } = detail
      this.responseStorage[path] = body

      const apiPath = path.replace('/kcsapi/', '')
      this.gameState.processResponse(apiPath, body, this.lastRequest)

      this.responseListeners.forEach(l => l(detail))
    } catch (ex) {
      console.error('[KCPS] game.response:', ex)
      this.onError('game.response', (ex as Error).message)
    }
  }

  getRequestStorage(): Record<string, unknown> {
    return this.requestStorage
  }

  getResponseStorage(): Record<string, unknown> {
    return this.responseStorage
  }

  getGameState(): GameStateManager {
    return this.gameState
  }

  cleanup(): void {
    this.requestStorage = {}
    this.responseStorage = {}
    this.lastRequest = null
    this.responseListeners.clear()
  }
}
