import http from 'node:http'

export type ServerState = 'stopped' | 'running' | 'error'

export interface ServerStatus {
  state: ServerState
  port?: number
  error?: string
}

export type StatusListener = (status: ServerStatus) => void

export class KcpsServer {
  private server: http.Server | null = null
  private _status: ServerStatus = { state: 'stopped' }
  private statusListeners: StatusListener[] = []

  get status(): ServerStatus {
    return this._status
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.push(listener)
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener)
    }
  }

  private setStatus(status: ServerStatus): void {
    this._status = status
    this.statusListeners.forEach(l => l(status))
  }

  start(port: number, handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): void {
    if (this.server) {
      this.stop()
    }

    this.server = http.createServer(handler)

    this.server.on('error', (err: Error) => {
      console.error('[KCPS] Server error:', err.message)
      this.setStatus({ state: 'error', error: err.message })
    })

    this.server.listen(port, () => {
      console.log(`[KCPS] Server started on port ${port}`)
      this.setStatus({ state: 'running', port })
    })
  }

  stop(): void {
    if (this.server) {
      this.server.close()
      // close() only stops accepting new connections; kill keep-alive
      // connections too, so the port is actually released
      this.server.closeAllConnections()
      this.server = null
      console.log('[KCPS] Server stopped')
      this.setStatus({ state: 'stopped' })
    }
  }

  restart(port: number, handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): void {
    this.stop()
    this.start(port, handler)
  }
}
