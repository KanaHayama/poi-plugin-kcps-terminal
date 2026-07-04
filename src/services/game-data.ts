import { store } from 'views/create-store'
import {
  constSelector, basicSelector, fleetsSelector, shipsSelector,
  equipsSelector, repairsSelector, mapsSelector, sortieSelector, battleSelector,
} from 'views/utils/selectors'
import type { GameStateManager } from '../state/game-state'

type StateSelector = (state: unknown) => unknown

// poi built-in selectors
const selectorMap: Record<string, StateSelector> = {
  const: constSelector,
  basic: basicSelector,
  fleets: fleetsSelector,
  ships: shipsSelector,
  equips: equipsSelector,
  repairs: repairsSelector,
  constructions: (state) => (state as Record<string, Record<string, unknown>>).info?.constructions,
  resources: (state) => (state as Record<string, Record<string, unknown>>).info?.resources,
  maps: mapsSelector,
  sortie: sortieSelector,
  battle: battleSelector,
}

export type GameDataResult =
  | { ok: true; value: unknown }
  | { ok: false }

/**
 * Resolves a data query by type — either a poi built-in selector or
 * plugin-maintained game state. `ok: false` means the type is unknown.
 */
export const getGameData = (type: string, gameState: GameStateManager): GameDataResult => {
  const selector = selectorMap[type]
  if (selector) {
    return { ok: true, value: selector(store.getState()) }
  }

  let value: unknown
  switch (type) {
    case 'miscellaneous':
      value = gameState.getMiscellaneous()
      break
    case 'landBasedAirCorps':
      value = gameState.getLandBasedAirCorps()
      break
    case 'preSets':
      value = gameState.getPreSets()
      break
    default:
      return { ok: false }
  }
  return { ok: true, value }
}
