/*
  A private library of utility functions used by several different routes.
*/
// imports
import axios, { AxiosInstance } from "axios"
import { BITBOX } from "bitbox-sdk"
import * as express from "express"
import * as util from "util"
import {
  iDecodeError,
  iSetEnvVars,
  RequestConfig
} from "./interfaces/RESTInterfaces"

// consts
const bitbox: BITBOX = new BITBOX()
const logger: any = require("./logging.js")
const wlogger: any = require("../../util/winston-logging")

util.inspect.defaultOptions = { depth: 1 }

// This function expects the Request Express.js object and an array as input.
// The array is then validated against freemium and pro-tier rate limiting
// requirements. A boolean is returned to indicate if the array size if valid
// or not.
export const validateArraySize = (
  req: express.Request,
  array: any[]
): boolean => {
  const FREEMIUM_INPUT_SIZE: number = 20
  const PRO_INPUT_SIZE: number = 100

  if (req.locals && req.locals.proLimit) {
    if (array.length <= PRO_INPUT_SIZE) return true
  } else if (array.length <= FREEMIUM_INPUT_SIZE) {
    return true
  }

  return false
}

// Returns true if user-provided cash address matches the correct network,
// mainnet or testnet. If NETWORK env var is not defined, it returns false.
// This prevent a common user-error issue that is easy to make: passing a
// testnet address into rest.bitcoin.com or passing a mainnet address into
// trest.bitcoin.com.
export const validateNetwork = (address: string): boolean => {
  try {
    const network: string = process.env.NETWORK

    // Return false if NETWORK is not defined.
    if (!network || network === "") {
      console.log(`Warning: NETWORK environment variable is not defined!`)
      return false
    }

    // Convert the user-provided address to a cashaddress, for easy detection
    // of the intended network.
    const cashAddr: string = bitbox.Address.toCashAddress(address)

    // Return true if the network and address both match testnet
    const addrIsTest: boolean = bitbox.Address.isTestnetAddress(cashAddr)
    if (network === "testnet" && addrIsTest) return true

    // Return true if the network and address both match mainnet
    const addrIsMain: boolean = bitbox.Address.isMainnetAddress(cashAddr)
    if (network === "mainnet" && addrIsMain) return true

    return false
  } catch (err) {
    logger.error(`Error in validateNetwork()`)
    return false
  }
}

// Dynamically set these based on env vars. Allows unit testing.
export const setEnvVars = (): iSetEnvVars => {
  const BitboxHTTP: AxiosInstance = axios.create({
    baseURL: process.env.RPC_BASEURL
  })
  const username: string = process.env.RPC_USERNAME
  const password: string = process.env.RPC_PASSWORD

  const requestConfig: RequestConfig = {
    method: "post",
    auth: {
      username: username,
      password: password
    },
    data: {
      jsonrpc: "1.0"
    }
  }

  return { BitboxHTTP, username, password, requestConfig }
}

// Error messages returned by a full node can be burried pretty deep inside the
// error object returned by Axios. This function attempts to extract and interpret
// error messages.
// Returns an object. If successful, obj.msg is a string.
// If there is a failure, obj.msg is false.
export const decodeError = (err: any): iDecodeError => {
  try {
    // Attempt to extract the full node error message.
    if (
      err.response &&
      err.response.data &&
      err.response.data.error &&
      err.response.data.error.message
    )
      return { msg: err.response.data.error.message, status: 400 }

    // Attempt to extract the Insight error message
    if (err.response && err.response.data)
      return { msg: err.response.data, status: err.response.status }

    // Attempt to detect a network connection error.
    if (err.message && err.message.indexOf("ENOTFOUND") > -1) {
      return {
        msg:
          "Network error: Could not communicate with full node or other external service.",
        status: 503
      }
    }

    // Different kind of network error
    if (err.message && err.message.indexOf("ENETUNREACH") > -1) {
      return {
        msg:
          "Network error: Could not communicate with full node or other external service.",
        status: 503
      }
    }

    return { msg: false, status: 500 }
  } catch (err) {
    wlogger.error(`unhandled error in route-utils.js/decodeError(): `, err)
    return { msg: false, status: 500 }
  }
}
