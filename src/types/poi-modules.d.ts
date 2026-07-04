declare module 'views/utils/selectors' {
  import type { Selector } from 'reselect'

  export const configSelector: Selector<unknown, unknown>
  export const constSelector: Selector<unknown, unknown>
  export const basicSelector: Selector<unknown, unknown>
  export const fleetsSelector: Selector<unknown, unknown>
  export const shipsSelector: Selector<unknown, unknown>
  export const equipsSelector: Selector<unknown, unknown>
  export const repairsSelector: Selector<unknown, unknown>
  export const mapsSelector: Selector<unknown, unknown>
  export const sortieSelector: Selector<unknown, unknown>
  export const battleSelector: Selector<unknown, unknown>
  export const stateSelector: Selector<unknown, unknown>
  export const extensionSelectorFactory: (id: string) => Selector<unknown, unknown>
}

declare module 'views/create-store' {
  import type { Store } from 'redux'
  export const store: Store
}

declare module 'electron' {
  export const clipboard: {
    writeText: (text: string) => void
    readText: () => string
  }
}

declare module 'views/services/utils' {
  export function gameRefreshPage(): void
  export function getTitleBarHeight(): number
  export function getPoiInfoHeight(): number
  export function getYOffset(): number
  export function getRealSize(): { width: number; height: number }
}
