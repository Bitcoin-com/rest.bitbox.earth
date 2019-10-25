"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const wtfnode = require("wtfnode") // Debugging the event loop
// const util = require("util")
var express = require("express");
var req_logging_1 = require("./middleware/req-logging");
// Middleware
var route_ratelimit_1 = require("./middleware/route-ratelimit");
var path = require("path");
var logger = require("morgan");
var wlogger = require("./util/winston-logging");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
// const basicAuth = require("express-basic-auth")
var helmet = require("helmet");
var debug = require("debug")("rest-cloud:server");
var http = require("http");
var cors = require("cors");
var AuthMW = require("./middleware/auth");
var swStats = require("swagger-stats");
var apiSpec;
if (process.env.NETWORK === "mainnet") {
    apiSpec = require("./public/bitcoin-com-mainnet-rest-v2.json");
}
else {
    apiSpec = require("./public/bitcoin-com-testnet-rest-v2.json");
}
// v2
var indexV2 = require("./routes/v2/index");
var healthCheckV2 = require("./routes/v2/health-check");
var addressV2 = require("./routes/v2/address");
var cashAccountsV2 = require("./routes/v2/cashaccounts");
var blockV2 = require("./routes/v2/block");
var blockchainV2 = require("./routes/v2/blockchain");
var controlV2 = require("./routes/v2/control");
var generatingV2 = require("./routes/v2/generating");
var miningV2 = require("./routes/v2/mining");
var networkV2 = require("./routes/v2/network");
var rawtransactionsV2 = require("./routes/v2/rawtransactions");
var transactionV2 = require("./routes/v2/transaction");
var utilV2 = require("./routes/v2/util");
var slpV2 = require("./routes/v2/slp");
require("dotenv").config();
var app = express();
app.locals.env = process.env;
app.use(swStats.getMiddleware({ swaggerSpec: apiSpec }));
app.use(helmet());
app.use(cors());
app.enable("trust proxy");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use("/public", express.static(__dirname + "/public"));
// Log each request to the console with IP addresses.
app.use(logger(":remote-addr :remote-user :method :url :status :response-time ms - :res[content-length] :user-agent"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// Local logging middleware for tracking incoming connection information.
app.use("/", req_logging_1.logReqInfo);
// Make io accessible to our router
app.use(function (req, res, next) {
    req.io = io;
    next();
});
var v2prefix = "v2";
// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
var auth = new AuthMW();
app.use("/" + v2prefix + "/", auth.mw());
// Rate limit on all v2 routes
app.use("/" + v2prefix + "/", route_ratelimit_1.routeRateLimit);
app.use("/", indexV2);
app.use("/" + v2prefix + "/" + "health-check", healthCheckV2);
app.use("/" + v2prefix + "/" + "address", addressV2.router);
app.use("/" + v2prefix + "/" + "cashAccounts", cashAccountsV2.router);
app.use("/" + v2prefix + "/" + "blockchain", blockchainV2.router);
app.use("/" + v2prefix + "/" + "block", blockV2.router);
app.use("/" + v2prefix + "/" + "control", controlV2.router);
app.use("/" + v2prefix + "/" + "generating", generatingV2);
app.use("/" + v2prefix + "/" + "mining", miningV2.router);
app.use("/" + v2prefix + "/" + "network", networkV2);
app.use("/" + v2prefix + "/" + "rawtransactions", rawtransactionsV2.router);
app.use("/" + v2prefix + "/" + "transaction", transactionV2.router);
app.use("/" + v2prefix + "/" + "util", utilV2.router);
app.use("/" + v2prefix + "/" + "slp", slpV2.router);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = {
        message: "Not Found",
        status: 404
    };
    next(err);
});
// error handler
app.use(function (err, req, res, next) {
    var status = err.status || 500;
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    // render the error page
    res.status(status);
    res.json({
        status: status,
        message: err.message
    });
});
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
console.log("rest.bitcoin.com started on port " + port);
/**
 * Create HTTP server.
 */
var server = http.createServer(app);
var io = require("socket.io").listen(server);
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
// Set the time before a timeout error is generated. This impacts testing and
// the handling of timeout errors. Is 10 seconds too agressive?
server.setTimeout(30 * 1000);
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
function normalizePort(val) {
    var port = parseInt(val, 10);
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
    if (error.syscall !== "listen")
        throw error;
    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
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
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug("Listening on " + bind);
}
