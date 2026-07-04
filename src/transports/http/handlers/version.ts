import type http from 'node:http'
import { version } from '../../../../package.json'
import { EXTENSION_KEY } from '../../../constants'
import { sendJson } from '../shared'

/**
 * Capability discovery for protocol negotiation: newer KCPS versions can
 * probe this endpoint to learn the plugin version and supported transports
 * before deciding how to communicate. /hello is kept untouched for legacy
 * clients. Extend `protocols` when a streaming transport is added.
 */
export const versionHandler = (
  _req: http.IncomingMessage,
  res: http.ServerResponse,
  _url: URL,
): void => {
  sendJson(res, {
    name: EXTENSION_KEY,
    version,
    protocols: ['http'],
  })
}
