import type { ServerStatus } from './transports/http/server'
import { createObservable } from './utils/observable'

export interface ErrorEntry {
  id: number
  time: Date
  source: string
  message: string
}

const MAX_ERRORS = 50
let nextErrorId = 1

// Module-level stores: state is kept even when the plugin panel is unmounted,
// and replayed to the UI on mount.
export const serverStatusStore = createObservable<ServerStatus>({ state: 'stopped' })
export const errorLogStore = createObservable<ErrorEntry[]>([])

export const reportError = (source: string, message: string): void => {
  const entry: ErrorEntry = { id: nextErrorId++, time: new Date(), source, message }
  errorLogStore.set([entry, ...errorLogStore.get()].slice(0, MAX_ERRORS))
  window.error?.(`[KCPS] ${source}: ${message}`)
}

export const clearErrors = (): void => {
  errorLogStore.set([])
}
