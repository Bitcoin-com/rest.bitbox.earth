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
var requestUtils = require("./services/requestUtils");
var bitbox = require("./services/bitbox");
var axios_1 = require("axios");
var router = express.Router();
var BitboxHTTP = bitbox.getInstance();
var RateLimit = require("express-rate-limit");
var config = {
    blockRateLimit1: undefined,
    blockRateLimit2: undefined,
    blockRateLimit3: undefined
};
var i = 1;
while (i < 4) {
    config["blockRateLimit" + i] = new RateLimit({
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
router.get("/", config.blockRateLimit1, function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.json({ status: "block" });
        return [2 /*return*/];
    });
}); });
router.get("/detailsByHash/:hash", config.blockRateLimit2, function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    var response, parsed, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.get(process.env.BITCOINCOM_BASEURL + "block/" + req.params.hash)];
            case 1:
                response = _a.sent();
                parsed = response.data;
                res.json(parsed);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500);
                return [2 /*return*/, res.send(error_1)];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/detailsByHeight/:height", config.blockRateLimit2, function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    var requestConfig;
    var _this = this;
    return __generator(this, function (_a) {
        requestConfig = requestUtils.getRequestConfig("getblockhash", [parseInt(req.params.height)]);
        BitboxHTTP(requestConfig)
            .then(function (response) { return __awaiter(_this, void 0, void 0, function () {
            var rsp, parsed, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get(process.env.BITCOINCOM_BASEURL + "block/" + response.data.result)];
                    case 1:
                        rsp = _a.sent();
                        parsed = rsp.data;
                        res.json(parsed);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        res.status(500);
                        return [2 /*return*/, res.send(error_2)];
                    case 3: return [2 /*return*/];
                }
            });
        }); })
            .catch(function (error) {
            res.status(500);
            return res.send(error);
        });
        return [2 /*return*/];
    });
}); });
module.exports = router;
