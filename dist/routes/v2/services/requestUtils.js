"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var username = process.env.RPC_USERNAME;
var password = process.env.RPC_PASSWORD;
exports.getRequestConfig = function (method, params) {
    return {
        method: "post",
        auth: {
            username: username,
            password: password
        },
        data: {
            jsonrpc: "1.0",
            id: method,
            method: method,
            params: params
        }
    };
};
