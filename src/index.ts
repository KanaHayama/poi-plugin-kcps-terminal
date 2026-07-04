import { PluginRoot } from './ui/plugin-root'
import { KcpsServer } from './transports/http/server'
import { GameStateManager } from './state/game-state'
import { GameEventHandler } from './state/game-event-handler'
import { createRouter } from './transports/http/router'
import { serverStatusStore, reportError } from './stores'
import { CONFIG_PATH_PORT, DEFAULT_PORT } from './constants'
import { kcpsTerminalConfigSelector } from './utils/selectors'
import { store } from 'views/create-store'

// Module-level state
let server: KcpsServer | null = null
let eventHandler: GameEventHandler | null = null
let unsubscribeStore: (() => void) | null = null
let unsubscribeStatus: (() => void) | null = null

export const reactClass = PluginRoot

export const pluginDidLoad = (): void => {
  // Initialize state management
  const gameState = new GameStateManager()
  eventHandler = new GameEventHandler(gameState, reportError)

  // Listen to game events
  window.addEventListener('game.request', eventHandler.handleRequest)
  window.addEventListener('game.response', eventHandler.handleResponse)

  // Create and start server
  server = new KcpsServer()
  unsubscribeStatus = server.onStatusChange(serverStatusStore.set)

  const router = createRouter({ eventHandler, gameState }, reportError)
  const port = window.config.get(CONFIG_PATH_PORT, DEFAULT_PORT) as number
  server.start(port, router)

  // Watch for port config changes and restart server
  // (the router does not depend on the port, so it is reused)
  let previousPort = port
  unsubscribeStore = store.subscribe(() => {
    const cfg = kcpsTerminalConfigSelector(store.getState())
    if (cfg.port !== previousPort) {
      previousPort = cfg.port
      server?.restart(cfg.port, router)
    }
  })
}

export const pluginWillUnload = (): void => {
  // Unsubscribe store watcher
  unsubscribeStore?.()
  unsubscribeStore = null

  // Stop server (before unsubscribing, so the UI sees the final "stopped" status)
  server?.stop()
  server = null
  unsubscribeStatus?.()
  unsubscribeStatus = null

  // Remove game event listeners
  if (eventHandler) {
    window.removeEventListener('game.response', eventHandler.handleResponse)
    window.removeEventListener('game.request', eventHandler.handleRequest)
    eventHandler.cleanup()
    eventHandler = null
  }
}
