import { IRequestConfig } from "../interfaces/IRequestConfig"

const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

type RPCMethod = "getblockhash";

export const getRequestConfig = (method: RPCMethod, params: (string | number)[]): IRequestConfig => {
    return {
        method: "post",
        auth: {
            username,
            password
        },
        data: {
            jsonrpc: "1.0",
            id: method,
            method,
            params
        }
    };
};
