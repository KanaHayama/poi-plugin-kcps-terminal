import { createSelector } from 'reselect'
import { configSelector } from 'views/utils/selectors'
import { get } from 'lodash'
import {
  CONFIG_PATH_PORT, CONFIG_PATH_TOKEN, CONFIG_PATH_ZOOM, CONFIG_PATH_QUALITY,
  DEFAULT_PORT, DEFAULT_TOKEN, DEFAULT_ZOOM, DEFAULT_QUALITY,
} from '../constants'

export interface KcpsTerminalConfig {
  port: number
  token: string
  zoom: number
  quality: number
}

export const kcpsTerminalConfigSelector = createSelector(
  configSelector,
  (cfg): KcpsTerminalConfig => ({
    port: get(cfg, CONFIG_PATH_PORT, DEFAULT_PORT) as number,
    token: get(cfg, CONFIG_PATH_TOKEN, DEFAULT_TOKEN) as string,
    zoom: get(cfg, CONFIG_PATH_ZOOM, DEFAULT_ZOOM) as number,
    quality: get(cfg, CONFIG_PATH_QUALITY, DEFAULT_QUALITY) as number,
  }),
)
