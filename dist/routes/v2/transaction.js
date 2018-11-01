"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var router = express.Router();
var axios_1 = require("axios");
var RateLimit = require("express-rate-limit");
var BITBOXCli = require("bitbox-cli/lib/bitbox-cli").default;
var BITBOX = new BITBOXCli();
var config = {
    transactionRateLimit1: undefined,
    transactionRateLimit2: undefined
};
var processInputs = function (tx) {
    if (tx.vin) {
        tx.vin.forEach(function (vin) {
            if (!vin.coinbase) {
                var address = vin.addr;
                vin.legacyAddress = BITBOX.Address.toLegacyAddress(address);
                vin.cashAddress = BITBOX.Address.toCashAddress(address);
                vin.value = vin.valueSat;
                delete vin.addr;
                delete vin.valueSat;
                delete vin.doubleSpentTxID;
            }
        });
    }
};
var i = 1;
while (i < 3) {
    config["transactionRateLimit" + i] = new RateLimit({
        windowMs: 60000,
        delayMs: 0,
        max: 60,
        handler: function (req, res /*next*/) {
            res.format({
                json: function () {
                    res.status(500).json({
                        error: "Too many requests. Limits are 60 requests per minute."
                    });
                }
            });
        }
    });
    i++;
}
router.get("/", config.transactionRateLimit1, function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.json({ status: "transaction" });
        return [2 /*return*/];
    });
}); });
router.get("/details/:txid", config.transactionRateLimit1, function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    var txs, result_1;
    return __generator(this, function (_a) {
        try {
            txs = JSON.parse(req.params.txid);
            if (txs.length > 20) {
                res.json({
                    error: "Array too large. Max 20 txids"
                });
            }
            result_1 = [];
            txs = txs.map(function (tx) {
                return axios_1.default.get(process.env.BITCOINCOM_BASEURL + "tx/" + tx);
            });
            axios_1.default.all(txs).then(axios_1.default.spread(function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                for (var i_1 = 0; i_1 < args.length; i_1++) {
                    var tmp = {};
                    var parsed = tmp.data.result;
                    result_1.push(parsed);
                }
                result_1.forEach(function (tx) {
                    processInputs(tx);
                });
                res.json(result_1);
            }));
        }
        catch (error) {
            axios_1.default
                .get(process.env.BITCOINCOM_BASEURL + "tx/" + req.params.txid)
                .then(function (response) {
                var parsed = response.data;
                if (parsed)
                    processInputs(parsed);
                res.json(parsed);
            })
                .catch(function (error) {
                res.send(error.response.data.error.message);
            });
        }
        return [2 /*return*/];
    });
}); });
module.exports = router;
