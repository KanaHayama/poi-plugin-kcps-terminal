import { useSyncExternalStore } from 'react'

/**
 * Minimal observable value store.
 * Lives at module level so state survives React component unmounts
 * (poi may unmount the plugin panel while the server keeps running).
 */
export interface Observable<T> {
  get: () => T
  set: (value: T) => void
  subscribe: (listener: () => void) => () => void
}

export const createObservable = <T>(initial: T): Observable<T> => {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next: T) => {
      value = next
      listeners.forEach(l => l())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export const useObservable = <T>(store: Observable<T>): T =>
  useSyncExternalStore(store.subscribe, store.get)
