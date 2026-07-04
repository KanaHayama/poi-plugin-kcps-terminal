export const EXTENSION_KEY = 'poi-plugin-kcps-terminal'

// i18n translation function (bound to plugin namespace)
const { i18n } = window
export const __ = i18n[EXTENSION_KEY].__.bind(i18n[EXTENSION_KEY])

// Config paths in poi's config store
export const CONFIG_PATH_PORT = 'plugin.kcpsTerminal.port'
export const CONFIG_PATH_TOKEN = 'plugin.kcpsTerminal.token'
export const CONFIG_PATH_ZOOM = 'plugin.kcpsTerminal.zoom'
export const CONFIG_PATH_QUALITY = 'plugin.kcpsTerminal.quality'

// Default values
// 5277: "KCPS" on a phone keypad. Note: on some Windows machines the
// Hyper-V/WSL excluded port ranges can cover this port (see README);
// affected users need to pick another port in both the plugin and KCPS.
export const DEFAULT_PORT = 5277
export const DEFAULT_TOKEN = ''
export const DEFAULT_ZOOM = 1.0
export const DEFAULT_QUALITY = 80

// Limits
export const MIN_PORT = 0
export const MAX_PORT = 65535
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 4.0
export const MIN_QUALITY = 0
export const MAX_QUALITY = 100

// Graphics
export const ORIGINAL_GRAPHIC_AREA_WIDTH = 1200
export const ASPECT_RATIO = 1 / 0.6
