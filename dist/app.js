"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// imports
var express = require("express");
var http = require("http");
var path = require("path");
var route_ratelimit_1 = require("./middleware/route-ratelimit");
// v2
var address_1 = require("./routes/v2/address");
var block_1 = require("./routes/v2/block");
var blockchain_1 = require("./routes/v2/blockchain");
var cashaccounts_1 = require("./routes/v2/cashaccounts");
var control_1 = require("./routes/v2/control");
var generating_1 = require("./routes/v2/generating");
var health_check_1 = require("./routes/v2/health-check");
var index_1 = require("./routes/v2/index");
var mining_1 = require("./routes/v2/mining");
var network_1 = require("./routes/v2/network");
var rawtransactions_1 = require("./routes/v2/rawtransactions");
var slp_1 = require("./routes/v2/slp");
var transaction_1 = require("./routes/v2/transaction");
var util_1 = require("./routes/v2/util");
var utilities_1 = require("./utilities");
// consts
var logger = require("morgan");
var wlogger = require("./util/winston-logging");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
// const basicAuth = require("express-basic-auth")
var helmet = require("helmet");
var cors = require("cors");
var AuthMW = require("./middleware/auth");
var BitcoinCashZMQDecoder = require("bitcoincash-zmq-decoder");
var swStats = require("swagger-stats");
var apiSpec = process.env.NETWORK === "mainnet"
    ? require("./public/bitcoin-com-mainnet-rest-v2.json")
    : require("./public/bitcoin-com-testnet-rest-v2.json");
var port = utilities_1.normalizePort(process.env.PORT || "3000");
var listening = function () {
    utilities_1.onListening(server);
};
var serverError = function () {
    utilities_1.onError(server, port);
};
// websockets
var zmq = require("zeromq");
var sock = zmq.socket("sub");
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
var v2prefix = "v2";
// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
var auth = new AuthMW();
app.use("/" + v2prefix + "/", auth.mw());
// Rate limit on all v2 routes
app.use("/" + v2prefix + "/", route_ratelimit_1.routeRateLimit);
app.use("/", index_1.default);
app.use("/" + v2prefix + "/" + "health-check", health_check_1.default);
app.use("/" + v2prefix + "/" + "address", address_1.default.router);
app.use("/" + v2prefix + "/" + "block", block_1.default.router);
app.use("/" + v2prefix + "/" + "blockchain", blockchain_1.default.router);
app.use("/" + v2prefix + "/" + "cashAccounts", cashaccounts_1.default.router);
app.use("/" + v2prefix + "/" + "control", control_1.default.router);
app.use("/" + v2prefix + "/" + "generating", generating_1.default);
app.use("/" + v2prefix + "/" + "mining", mining_1.default.router);
app.use("/" + v2prefix + "/" + "network", network_1.default);
app.use("/" + v2prefix + "/" + "rawtransactions", rawtransactions_1.default.router);
app.use("/" + v2prefix + "/" + "transaction", transaction_1.default.router);
app.use("/" + v2prefix + "/" + "util", util_1.default.router);
app.use("/" + v2prefix + "/" + "slp", slp_1.default.router);
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
app.set("port", port);
/**
 * Create HTTP server.
 */
var server = http.createServer(app);
var io = require("socket.io").listen(server);
io.on("connection", function (socket) {
    console.log("Socket Connected");
    socket.on("disconnect", function () {
        console.log("Socket Disconnected");
    });
});
/**
 * Setup ZMQ connections if ZMQ URL and port provided
 */
if (process.env.ZEROMQ_URL && process.env.ZEROMQ_PORT) {
    console.log("Connecting to BCH ZMQ at " + process.env.ZEROMQ_URL + ":" + process.env.ZEROMQ_PORT);
    var bitcoincashZmqDecoder_1 = new BitcoinCashZMQDecoder(process.env.NETWORK);
    sock.connect("tcp://" + process.env.ZEROMQ_URL + ":" + process.env.ZEROMQ_PORT);
    sock.subscribe("raw");
    sock.on("message", function (topic, message) {
        try {
            var decoded = topic.toString("ascii");
            if (decoded === "rawtx") {
                var txd = bitcoincashZmqDecoder_1.decodeTransaction(message);
                io.emit("transactions", JSON.stringify(txd, null, 2));
            }
            else if (decoded === "rawblock") {
                var blck = bitcoincashZmqDecoder_1.decodeBlock(message);
                io.emit("blocks", JSON.stringify(blck, null, 2));
            }
        }
        catch (error) {
            var errorMessage = "Error processing ZMQ message";
            console.log(errorMessage, error);
            wlogger.error(errorMessage, error);
        }
    });
}
else {
    console.log("ZEROMQ_URL and ZEROMQ_PORT env vars missing. Skipping ZMQ connection.");
}
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on("error", serverError);
server.on("listening", listening);
// Set the time before a timeout error is generated. This impacts testing and
// the handling of timeout errors.
server.setTimeout(30 * 1000);
