interface PoiConfig {
  get: <T = unknown>(path: string, defaultValue?: T) => T
  set: (path: string, value?: unknown) => void
}

interface Window {
  ROOT: string
  APPDATA_PATH: string
  POI_VERSION: string
  config: PoiConfig
  language: string
  getStore: (path?: string) => unknown
  isMain: boolean
  log: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  success: (message: string) => void
  notify: (options: { title: string; body: string }) => void
  toggleModal: (title: string, content: string, buttons?: unknown[]) => void
  i18n: PoiI18n
}

interface PoiI18nNamespace {
  __: (key: string) => string
}

interface PoiI18n {
  [key: string]: PoiI18nNamespace
}

declare const config: PoiConfig
declare const i18n: PoiI18n
declare const ROOT: string
declare const APPDATA_PATH: string
declare const POI_VERSION: string
