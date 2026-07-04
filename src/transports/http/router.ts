import type http from 'node:http'
import { CONFIG_PATH_TOKEN, DEFAULT_TOKEN } from '../../constants'
import type { RouteDependencies, RouteHandler } from './shared'
import { sendForbidden, sendNotFound, sendServerError } from './shared'
import { helloHandler } from './handlers/hello'
import { versionHandler } from './handlers/version'
import { createCaptureHandler } from './handlers/capture'
import { createMouseHandler } from './handlers/mouse'
import { refreshHandler } from './handlers/refresh'
import { createDataHandler } from './handlers/data'
import { createResponseHandler } from './handlers/response'
import { createRequestHandler } from './handlers/request'

// Discovery endpoints that do not require authentication
const PUBLIC_PATHS = ['/', '/hello', '/version']

export const createRouter = (
  deps: RouteDependencies,
  onError: (source: string, message: string) => void,
): ((req: http.IncomingMessage, res: http.ServerResponse) => void) => {
  const handlers: Record<string, RouteHandler> = {
    '/': helloHandler,
    '/hello': helloHandler,
    '/version': versionHandler,
    '/capture': createCaptureHandler(onError),
    '/mouse': createMouseHandler(onError),
    '/refresh': refreshHandler,
    '/data': createDataHandler(deps),
    '/response': createResponseHandler(deps),
    '/request': createRequestHandler(deps),
  }

  return (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const pathname = url.pathname

      if (PUBLIC_PATHS.includes(pathname)) {
        handlers[pathname]!(req, res, url)
        return
      }

      // Authentication check
      const token = window.config.get(CONFIG_PATH_TOKEN, DEFAULT_TOKEN) as string
      if (token !== '' && url.searchParams.get('token') !== token) {
        sendForbidden(res)
        return
      }

      const handler = handlers[pathname]
      if (!handler) {
        sendNotFound(res)
        return
      }

      const result = handler(req, res, url)
      if (result instanceof Promise) {
        result.catch(err => {
          onError(pathname, (err as Error).message)
          if (!res.headersSent) sendServerError(res)
        })
      }
    } catch (err) {
      onError('router', (err as Error).message)
      if (!res.headersSent) sendServerError(res)
    }
  }
}
