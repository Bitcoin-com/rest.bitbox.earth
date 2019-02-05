"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const RateLimit = require("express-rate-limit")
const routeUtils = require("./route-utils")
const logger = require("./logging.js")
const strftime = require("strftime")

const bitboxproxy = require("slpjs").bitbox
const utils = require("slpjs").utils
const slpBalances = require("slp-balances")
// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 5 }

// SLP tx db
const level = require("level")
const slpTxDb = level("./slp-tx-db")

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default
const BITBOX = new BITBOXCli()

//const SLPsdk = require("@spendbch/slp-sdk/lib/SLP").default // TODO: Change to slp-sdk
const SLPsdk = require("slp-sdk/lib/SLP").default
const SLP = new SLPsdk()
//console.log(`SLP.Util: ${util.inspect(SLP.Util)}`)

// Retrieve raw transactions details from the full node.
async function getRawTransactionsFromNode(txids: string[]) {
  try {
    const {
      BitboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    const txPromises = txids.map(async txid => {
      console.log("request", txid) // TODO: Remove
      // Check slpTxDb
      try {
        if (slpTxDb.isOpen()) {
          const rawTx = await slpTxDb.get(txid)
          console.log("cached", txid) // TODO: Remove
          return rawTx
        }
      } catch (err) { }

      requestConfig.data.id = "getrawtransaction"
      requestConfig.data.method = "getrawtransaction"
      requestConfig.data.params = [txid, 0]

      const response = await BitboxHTTP(requestConfig)
      console.log("rpccall", txid) // TODO: Remove
      const result = response.data.result

      // Insert to slpTxDb
      try {
        if (slpTxDb.isOpen()) {
          await slpTxDb.put(txid, result)
        }
      } catch (err) {
        console.log("Error inserting to slpTxDb", err)
      }

      return result
    })

    const results = await axios.all(txPromises)
    return results
  } catch (err) {
    throw err
  }
}

const slpValidator = SLP.Utils.createValidator(
  process.env.NETWORK,
  getRawTransactionsFromNode
)

const requestConfig: IRequestConfig = {
  method: "post",
  auth: {
    username: username,
    password: password
  },
  data: {
    jsonrpc: "1.0"
  }
}

interface IRLConfig {
  [slpRateLimit1: string]: any
  slpRateLimit2: any
  slpRateLimit3: any
  slpRateLimit4: any
  slpRateLimit5: any
  slpRateLimit6: any
  slpRateLimit7: any
}

const config: IRLConfig = {
  slpRateLimit1: undefined,
  slpRateLimit2: undefined,
  slpRateLimit3: undefined,
  slpRateLimit4: undefined,
  slpRateLimit5: undefined,
  slpRateLimit6: undefined,
  slpRateLimit7: undefined
}

let i = 1
while (i < 8) {
  config[`slpRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: (req: express.Request, res: express.Response /*next*/) => {
      res.format({
        json: () => {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

router.get("/", config.slpRateLimit1, root)
router.get("/list", config.slpRateLimit2, list)
router.get("/list/:tokenId", config.slpRateLimit3, listSingleToken)
router.get(
  "/balancesForAddress/:address",
  config.slpRateLimit4,
  balancesForAddress
)
router.get(
  "/balance/:address/:tokenId",
  config.slpRateLimit5,
  balancesForAddressByTokenID
)
router.get("/address/convert/:address", config.slpRateLimit6, convertAddress)
router.post("/validate", config.slpRateLimit7, validateBulk)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "slp" })
}

async function list(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    // Get data from BitDB.
    const tokenRes = await axios.get(url)

    let formattedTokens: Array<any> = []

    if (tokenRes.data.c.length) {
      tokenRes.data.c.forEach((token: any) => {
        formattedTokens.push({
          id: token.tx.h,
          timestamp: strftime("%Y-%m-%d %H:%M", new Date(token.blk.t * 1000)),
          symbol: token.out[0].s4,
          name: token.out[0].s5,
          document: token.out[0].s6
        })
      })
    }

    res.json(formattedTokens)

    return formattedTokens
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /list: ${err.message}` })
  }
}

async function listSingleToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let tokenId = req.params.tokenId
    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      },
      r: {
        f:
          '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    const tokenRes = await axios.get(url)
    const tokens = tokenRes.data.c
    if (tokenRes.data.u && tokenRes.data.u.length)
      tokens.concat(tokenRes.data.u)

    let t
    tokens.forEach((token: any) => {
      if (token.id === req.params.tokenId) t = token
    })
    return res.json(t)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({ error: `Error in /list/:tokenId: ${err.message}` })
  }
}

// TODO - Only works for mainnet. Get it to work for testnet too.
async function balancesForAddress(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      var legacyAddr = SLP.Utils.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    let cashAddr = SLP.Utils.toCashAddress(address)
    const networkIsValid = routeUtils.validateNetwork(cashAddr)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const slpAddr = utils.toSlpAddress(req.params.address)
    const balances = await bitboxproxy.getAllTokenBalances(slpAddr)
    balances.slpAddress = slpAddr
    balances.cashAddress = utils.toCashAddress(slpAddr)
    balances.legacyAddress = BITBOX.Address.toLegacyAddress(
      balances.cashAddress
    )
    return res.json(balances)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({
      error: `Error in /balancesForAddress/:address: ${err.message}`
    })
  }
}

// TODO - Only works for mainnet. Get it to work for testnet too.
async function balancesForAddressByTokenID(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let address = req.params.address
    let tokenId = req.params.tokenId
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    if (!tokenId || tokenId === "") {
      res.status(400)
      return res.json({ error: "tokenId can not be empty" })
    }

    // Ensure the input is a valid BCH address.
    try {
      var legacyAddr = SLP.Utils.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    let cashAddr = SLP.Utils.toCashAddress(address)
    const networkIsValid = routeUtils.validateNetwork(cashAddr)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    const slpAddr = utils.toSlpAddress(address)
    const balances = await bitboxproxy.getAllTokenBalances(slpAddr)
    const query = {
      v: 3,
      q: {
        find: { "out.h1": "534c5000", "out.s3": "GENESIS" },
        limit: 1000
      },
      r: {
        f:
          '[ .[] | { id: .tx.h, timestamp: (.blk.t | strftime("%Y-%m-%d %H:%M")), symbol: .out[0].s4, name: .out[0].s5, document: .out[0].s6 } ]'
      }
    }

    const s = JSON.stringify(query)
    const b64 = Buffer.from(s).toString("base64")
    const url = `${process.env.BITDB_URL}q/${b64}`

    const tokenRes = await axios.get(url)
    const tokens = tokenRes.data.c
    if (tokenRes.data.u && tokenRes.data.u.length)
      tokens.concat(tokenRes.data.u)

    let t: any
    tokens.forEach((token: any) => {
      if (token.id === req.params.tokenId) t = token
    })

    interface ReturnObj {
      [id: string]: any
      timestamp: any
      symbol: any
      name: any
      document: any
      balance: any
      slpAddress: any
      cashAddress: any
      legacyAddress: any
    }
    const obj: ReturnObj = {
      id: undefined,
      timestamp: undefined,
      symbol: undefined,
      name: undefined,
      document: undefined,
      balance: undefined,
      slpAddress: undefined,
      cashAddress: undefined,
      legacyAddress: undefined
    }

    obj.id = t.id
    obj.timestamp = t.timestamp
    obj.symbol = t.symbol
    obj.name = t.name
    obj.document = t.document
    obj.balance = balances[req.params.tokenId]
    obj.slpAddress = slpAddr
    obj.cashAddress = utils.toCashAddress(slpAddr)
    obj.legacyAddress = BITBOX.Address.toLegacyAddress(obj.cashAddress)
    return res.json(obj)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({
      error: `Error in /balance/:address/:tokenId: ${err.message}`
    })
  }
}

async function convertAddress(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }
    const slpAddr = utils.toSlpAddress(req.params.address)
    const obj: {
      [slpAddress: string]: any
      cashAddress: any
      legacyAddress: any
    } = {
      slpAddress: "",
      cashAddress: "",
      legacyAddress: ""
    }
    obj.slpAddress = slpAddr
    obj.cashAddress = utils.toCashAddress(slpAddr)
    obj.legacyAddress = BITBOX.Address.toLegacyAddress(obj.cashAddress)
    return res.json(obj)
  } catch (err) {
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }
    res.status(500)
    return res.json({
      error: `Error in /address/convert/:address: ${err.message}`
    })
  }
}

async function validateBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txids = req.body.txids

    // Reject if address is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids needs to be an array" })
    }

    // Enforce no more than 20 txids.
    if (txids.length > 20) {
      res.status(400)
      return res.json({
        error: "Array too large. Max 20 txids"
      })
    }

    logger.debug(`Executing slp/validate with these txids: `, txids)

    // Validate each txid
    const validatePromises = txids.map(async txid => {
      return await isValidSlpTxid(txid)
    })

    // Wait for all promises to resolve.
    const validateResults = await Promise.all(validatePromises)

    res.status(200)
    return res.json(validateResults)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function isValidSlpTxid(txid: string): Promise<boolean> {
  const isValid = await slpValidator.isValidSlpTxid(txid)
  console.log(txid, isValid)

  const retObj: any = {
    txid: txid,
    isValid: isValid
  }

  return retObj
}

module.exports = {
  router,
  testableComponents: {
    root,
    list,
    listSingleToken,
    balancesForAddress,
    balancesForAddressByTokenID,
    convertAddress,
    validateBulk
  }
}
