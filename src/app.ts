// imports
import * as express from "express"
import * as http from "http"
import { Socket } from "net"
import * as path from "path"
import { routeRateLimit } from "./middleware/route-ratelimit"
// v2
import addressV2 from "./routes/v2/address"
import blockV2 from "./routes/v2/block"
import blockchainV2 from "./routes/v2/blockchain"
import cashAccountsV2 from "./routes/v2/cashaccounts"
import controlV2 from "./routes/v2/control"
import generatingV2 from "./routes/v2/generating"
import healthCheckV2 from "./routes/v2/health-check"
import indexV2 from "./routes/v2/index"
import miningV2 from "./routes/v2/mining"
import networkV2 from "./routes/v2/network"
import rawtransactionsV2 from "./routes/v2/rawtransactions"
import slpV2 from "./routes/v2/slp"
import transactionV2 from "./routes/v2/transaction"
import utilV2 from "./routes/v2/util"
import { normalizePort, onError, onListening } from "./utilities"

// consts
const logger: any = require("morgan")
const wlogger: any = require("./util/winston-logging")
const cookieParser: any = require("cookie-parser")
const bodyParser: any = require("body-parser")
// const basicAuth = require("express-basic-auth")
const helmet: any = require("helmet")
const cors: any = require("cors")
const AuthMW: any = require("./middleware/auth")
const BitcoinCashZMQDecoder: any = require("bitcoincash-zmq-decoder")
const swStats: any = require("swagger-stats")
const apiSpec: any =
  process.env.NETWORK === "mainnet"
    ? require("./public/bitcoin-com-mainnet-rest-v2.json")
    : require("./public/bitcoin-com-testnet-rest-v2.json")
const port: string | number | boolean = normalizePort(
  process.env.PORT || "3000"
)

const listening = (): void => {
  onListening(server)
}

const serverError = (): void => {
  onError(server, port)
}

// websockets
const zmq = require("zeromq")
const sock: any = zmq.socket("sub")

interface IError {
  message: string
  status: number
}

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
app.use(logger("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

//
// let username = process.env.USERNAME;
// let password = process.env.PASSWORD;
//
// app.use(basicAuth(
//   {
//     users: { username: password }
//   }
// ));

// interface ICustomRequest extends express.Request {
//   io: any
// }

// Make io accessible to our router
// app.use(
//   (req: ICustomRequest, res: express.Response, next: express.NextFunction) => {
//     console.log(io)
//     req.io = io

//     next()
//   }
// )

const v2prefix = "v2"

// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
const auth = new AuthMW()
app.use(`/${v2prefix}/`, auth.mw())

// Rate limit on all v2 routes
app.use(`/${v2prefix}/`, routeRateLimit)
app.use("/", indexV2)
app.use(`/${v2prefix}/` + `health-check`, healthCheckV2)
app.use(`/${v2prefix}/` + `address`, addressV2.router)
app.use(`/${v2prefix}/` + `block`, blockV2.router)
app.use(`/${v2prefix}/` + `blockchain`, blockchainV2.router)
app.use(`/${v2prefix}/` + `cashAccounts`, cashAccountsV2.router)
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
app.set("port", port)

/**
 * Create HTTP server.
 */
const server: http.Server = http.createServer(app)
const io = require("socket.io").listen(server)
io.on("connection", (socket: Socket) => {
  console.log("Socket Connected")

  socket.on("disconnect", () => {
    console.log("Socket Disconnected")
  })
})

/**
 * Setup ZMQ connections if ZMQ URL and port provided
 */

if (process.env.ZEROMQ_URL && process.env.ZEROMQ_PORT) {
  console.log(
    `Connecting to BCH ZMQ at ${process.env.ZEROMQ_URL}:${
      process.env.ZEROMQ_PORT
    }`
  )
  const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder(process.env.NETWORK)

  sock.connect(`tcp://${process.env.ZEROMQ_URL}:${process.env.ZEROMQ_PORT}`)
  sock.subscribe("raw")

  sock.on("message", (topic: any, message: string) => {
    try {
      const decoded: string = topic.toString("ascii")
      if (decoded === "rawtx") {
        const txd = bitcoincashZmqDecoder.decodeTransaction(message)
        io.emit("transactions", JSON.stringify(txd, null, 2))
      } else if (decoded === "rawblock") {
        const blck = bitcoincashZmqDecoder.decodeBlock(message)
        io.emit("blocks", JSON.stringify(blck, null, 2))
      }
    } catch (error) {
      const errorMessage = "Error processing ZMQ message"
      console.log(errorMessage, error)
      wlogger.error(errorMessage, error)
    }
  })
} else {
  console.log(
    "ZEROMQ_URL and ZEROMQ_PORT env vars missing. Skipping ZMQ connection."
  )
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on("error", serverError)
server.on("listening", listening)

// Set the time before a timeout error is generated. This impacts testing and
// the handling of timeout errors.
server.setTimeout(30 * 1000)
