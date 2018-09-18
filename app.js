"use strict";

const express = require("express");
const path = require("path");
//const favicon = require("serve-favicon");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
//const basicAuth = require("express-basic-auth");
const helmet = require("helmet");
//const RateLimit = require("express-rate-limit");
//const axios = require("axios");
const debug = require("debug")("rest-cloud:server");
const http = require("http");
const BitcoinCashZMQDecoder = require("bitcoincash-zmq-decoder");

const zmq = require("zeromq");
const sock = zmq.socket("sub");

const swStats = require("swagger-stats");
const apiSpec = require("./public/bitcoin-com-rest-v1.json");

require("dotenv").config();

const app = express();

const index = require("./routes/index");
const healthCheck = require("./routes/health-check");
const address = require("./routes/address");

const block = require("./routes/block");
const blockchain = require("./routes/blockchain");
const control = require("./routes/control");
const generating = require("./routes/generating");
const mining = require("./routes/mining");
const network = require("./routes/network");
const rawtransactions = require("./routes/rawtransactions");
const transaction = require("./routes/transaction");
const util = require("./routes/util");

app.use(swStats.getMiddleware({ swaggerSpec: apiSpec }));

app.use(helmet());
const cors = require("cors");
app.use(cors());
app.enable("trust proxy");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use("/public", express.static(`${__dirname}/public`));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
//
// let username = process.env.USERNAME;
// let password = process.env.PASSWORD;
//
// app.use(basicAuth(
//   {
//     users: { username: password }
//   }
// ));

// Make io accessible to our router
app.use(function(req, res, next) {
  req.io = io;
  next();
});

const prefix = "v1";
app.use("/", index);
app.use(`/${prefix}/` + `health-check`, healthCheck);
app.use(`/${prefix}/` + `address`, address.router);
app.use(`/${prefix}/` + `blockchain`, blockchain);
app.use(`/${prefix}/` + `block`, block);
app.use(`/${prefix}/` + `control`, control);
app.use(`/${prefix}/` + `generating`, generating);
app.use(`/${prefix}/` + `mining`, mining);
app.use(`/${prefix}/` + `network`, network);
app.use(`/${prefix}/` + `rawtransactions`, rawtransactions);
app.use(`/${prefix}/` + `transaction`, transaction);
app.use(`/${prefix}/` + `util`, util);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    status: 500,
    message: err.message,
  });
});

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
const io = require("socket.io").listen(server);

io.on("connection", socket => {
  console.log("Socket Connected");

  socket.on("disconnect", () => {
    console.log("Socket Disconnected");
  });
});

const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder(process.env.NETWORK);

sock.connect(`tcp://${process.env.ZEROMQ_URL}:${process.env.ZEROMQ_PORT}`);
sock.subscribe("raw");

sock.on("message", (topic, message) => {
  const decoded = topic.toString("ascii");
  if (decoded === "rawtx") {
    const txd = bitcoincashZmqDecoder.decodeTransaction(message);
    io.emit("transactions", JSON.stringify(txd, null, 2));
  } else if (decoded === "rawblock") {
    const blck = bitcoincashZmqDecoder.decodeBlock(message);
    io.emit("blocks", JSON.stringify(blck, null, 2));
  }
});
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") throw error;

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}
//
// module.exports = app;
