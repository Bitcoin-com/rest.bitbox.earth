import * as http from "http"
import { ServerAddress } from "./routes/v2/interfaces/RESTInterfaces"
/**
 * Event listener for HTTP server "listening" event.
 */
export function onListening(server: http.Server): void {
  const addr: string | ServerAddress = server.address()
  const bind: string =
    typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`
  return console.log(`rest.bitcoin.com started on ${bind}`)
}

/**
 * Event listener for HTTP server "error" event.
 */
export function onError(error: any, port: string | number | boolean): any {
  if (error.syscall !== "listen") throw error

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case "EADDRINUSE":
      console.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Normalize a port into a number, string, or false.
 */

export function normalizePort(val: string): string | number | boolean {
  const port: number = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}
