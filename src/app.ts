"use strict"

// const wtfnode = require("wtfnode") // Debugging the event loop
// const util = require("util")

import * as express from "express"
import { logReqInfo } from "./middleware/req-logging"
// Middleware
import { routeRateLimit } from "./middleware/route-ratelimit"

const path = require("path")
const logger = require("morgan")
const wlogger = require("./util/winston-logging")
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
// const basicAuth = require("express-basic-auth")
const helmet = require("helmet")
const debug = require("debug")("rest-cloud:server")
const http = require("http")
const cors = require("cors")
const AuthMW = require("./middleware/auth")

const swStats = require("swagger-stats")
let apiSpec
if (process.env.NETWORK === "mainnet") {
  apiSpec = require("./public/bitcoin-com-mainnet-rest-v2.json")
} else {
  apiSpec = require("./public/bitcoin-com-testnet-rest-v2.json")
}

// v2
const indexV2 = require("./routes/v2/index")
const healthCheckV2 = require("./routes/v2/health-check")
const addressV2 = require("./routes/v2/address")
const cashAccountsV2 = require("./routes/v2/cashaccounts")
const blockV2 = require("./routes/v2/block")
const blockchainV2 = require("./routes/v2/blockchain")
const controlV2 = require("./routes/v2/control")
const generatingV2 = require("./routes/v2/generating")
const miningV2 = require("./routes/v2/mining")
const networkV2 = require("./routes/v2/network")
const rawtransactionsV2 = require("./routes/v2/rawtransactions")
const transactionV2 = require("./routes/v2/transaction")
const utilV2 = require("./routes/v2/util")
const slpV2 = require("./routes/v2/slp")

interface IError {
  message: string
  status: number
}

require("dotenv").config()

const app: express.Application = express()

app.locals.env = process.env

app.use(swStats.getMiddleware({ swaggerSpec: apiSpec }))

app.use(helmet())

app.use(cors())
app.enable("trust proxy")

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")

app.use("/public", express.static(`${__dirname}/public`))

// Log each request to the console with IP addresses.
app.use(
  logger(
    `:remote-addr :remote-user :method :url :status :response-time ms - :res[content-length] :user-agent`
  )
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

// Local logging middleware for tracking incoming connection information.
app.use(`/`, logReqInfo)

//
// let username = process.env.USERNAME;
// let password = process.env.PASSWORD;
//
// app.use(basicAuth(
//   {
//     users: { username: password }
//   }
// ));

interface ICustomRequest extends express.Request {
  io: any
}

// Make io accessible to our router
app.use(
  (req: ICustomRequest, res: express.Response, next: express.NextFunction) => {
    req.io = io

    next()
  }
)

const v2prefix = "v2"

// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
const auth = new AuthMW()
app.use(`/${v2prefix}/`, auth.mw())

// Rate limit on all v2 routes
app.use(`/${v2prefix}/`, routeRateLimit)
app.use("/", indexV2)
app.use(`/${v2prefix}/` + `health-check`, healthCheckV2)
app.use(`/${v2prefix}/` + `address`, addressV2.router)
app.use(`/${v2prefix}/` + `cashAccounts`, cashAccountsV2.router)
app.use(`/${v2prefix}/` + `blockchain`, blockchainV2.router)
app.use(`/${v2prefix}/` + `block`, blockV2.router)
app.use(`/${v2prefix}/` + `control`, controlV2.router)
app.use(`/${v2prefix}/` + `generating`, generatingV2)
app.use(`/${v2prefix}/` + `mining`, miningV2.router)
app.use(`/${v2prefix}/` + `network`, networkV2)
app.use(`/${v2prefix}/` + `rawtransactions`, rawtransactionsV2.router)
app.use(`/${v2prefix}/` + `transaction`, transactionV2.router)
app.use(`/${v2prefix}/` + `util`, utilV2.router)
app.use(`/${v2prefix}/` + `slp`, slpV2.router)

// catch 404 and forward to error handler
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const err: IError = {
      message: "Not Found",
      status: 404
    }

    next(err)
  }
)

// error handler
app.use(
  (
    err: IError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const status = err.status || 500

    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get("env") === "development" ? err : {}

    // render the error page
    res.status(status)
    res.json({
      status: status,
      message: err.message
    })
  }
)

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "3000")
app.set("port", port)
console.log(`rest.bitcoin.com started on port ${port}`)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)
const io = require("socket.io").listen(server)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on("error", onError)
server.on("listening", onListening)

// Set the time before a timeout error is generated. This impacts testing and
// the handling of timeout errors. Is 10 seconds too agressive?
server.setTimeout(30 * 1000)

// Dump details about the event loop to debug a possible memory leak
// wtfnode.setLogger("info", function(data) {
//   wlogger.verbose(`wtfnode info: ${data}`)
// })
// wtfnode.setLogger("warn", function(data) {
//   wlogger.verbose(`wtfnode warn: ${data}`)
// })
// wtfnode.setLogger("error", function(data) {
//   wlogger.verbose(`wtfnode error: ${data}`)
// })
// setInterval(function() {
//   wtfnode.dump()
// }, 60000 * 5)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10)

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

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: any) {
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
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address()
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`
  debug(`Listening on ${bind}`)
}
//
// module.exports = app;
