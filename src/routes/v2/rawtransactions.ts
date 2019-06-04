// imports
import axios, { AxiosResponse } from "axios"
import * as express from "express"
import * as util from "util"
import {
  DecodedScriptInterface,
  RawTransactionInterface
} from "./interfaces/RESTInterfaces"
import routeUtils = require("./route-utils")
import wlogger = require("../../util/winston-logging")

// consts
const router: any = express.Router()

// Used to convert error messages to strings, to safely pass to users.
util.inspect.defaultOptions = { depth: 1 }

router.get("/", root)
router.get("/decodeRawTransaction/:hex", decodeRawTransactionSingle)
router.post("/decodeRawTransaction", decodeRawTransactionBulk)
router.get("/decodeScript/:hex", decodeScriptSingle)
router.post("/decodeScript", decodeScriptBulk)
router.get("/getRawTransaction/:txid", getRawTransactionSingle)
router.post("/getRawTransaction", getRawTransactionBulk)
router.get("/sendRawTransaction/:hex", sendRawTransactionSingle)
router.post("/sendRawTransaction", sendRawTransactionBulk)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "rawtransactions" })
}

// Decode transaction hex into a JSON object.
// GET
async function decodeRawTransactionSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const hex: string = req.params.hex

    // Throw an error if hex is empty.
    if (!hex || hex === "") {
      res.status(400)
      return res.json({ error: "hex can not be empty" })
    }

    const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()

    requestConfig.data.id = "decoderawtransaction"
    requestConfig.data.method = "decoderawtransaction"
    requestConfig.data.params = [hex]

    const response: AxiosResponse = await BitboxHTTP(requestConfig)
    const rawTransaction: RawTransactionInterface = response.data.result
    return res.json(rawTransaction)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(
      `Error in rawtransactions.ts/decodeRawTransactionSingle().`,
      err
    )

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function decodeRawTransactionBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let hexes: string[] = req.body.hexes

    if (!Array.isArray(hexes)) {
      res.status(400)
      return res.json({ error: "hexes must be an array" })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, hexes)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element in the address array.
    for (let i: number = 0; i < hexes.length; i++) {
      const thisHex: string = hexes[i]

      // Reject if id is empty
      if (!thisHex || thisHex === "") {
        res.status(400)
        return res.json({ error: "Encountered empty hex" })
      }
    }

    // Loop through each height and creates an array of requests to call in parallel
    const promises: Promise<RawTransactionInterface>[] = hexes.map(
      async (hex: string): Promise<RawTransactionInterface> => {
        const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()
        requestConfig.data.id = "decoderawtransaction"
        requestConfig.data.method = "decoderawtransaction"
        requestConfig.data.params = [hex]

        return await BitboxHTTP(requestConfig)
      }
    )

    // Wait for all parallel Insight requests to return.
    const axiosResult: any[] = await axios.all(promises)

    // Retrieve the data part of the result.
    const result: RawTransactionInterface[] = axiosResult.map(
      (x: AxiosResponse): RawTransactionInterface => x.data.result
    )

    res.status(200)
    return res.json(result)

    /*
    // Loop through each hex and creates an array of requests to call in parallel
    hexes = hexes.map(async (hex: any) => {
      if (!hex || hex === "") {
        res.status(400)
        return res.json({ error: "Encountered empty hex" })
      }

      const {
        BitboxHTTP,
        username,
        password,
        requestConfig
      } = routeUtils.setEnvVars()

      requestConfig.data.id = "decoderawtransaction"
      requestConfig.data.method = "decoderawtransaction"
      requestConfig.data.params = [hex]

      return await BitboxHTTP(requestConfig)
    })

    const result: Array<any> = []
    return axios.all(hexes).then(
      axios.spread((...args) => {
        args.forEach((arg: any) => {
          if (arg) {
            result.push(arg.data.result)
          }
        })
        res.status(200)
        return res.json(result)
      })
    )
*/
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/getRawTransaction: `, err)
    wlogger.error(
      `Error in rawtransactions.ts/decodeRawTransactionBulk().`,
      err
    )

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Decode a raw transaction from hex to assembly.
// GET single
async function decodeScriptSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const hex: string = req.params.hex

    // Throw an error if hex is empty.
    if (!hex || hex === "") {
      res.status(400)
      return res.json({ error: "hex can not be empty" })
    }

    const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()

    requestConfig.data.id = "decodescript"
    requestConfig.data.method = "decodescript"
    requestConfig.data.params = [hex]

    const response: AxiosResponse = await BitboxHTTP(requestConfig)
    const decodedScriptInterface: DecodedScriptInterface = response.data.result

    return res.json(decodedScriptInterface)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeScript: `, err)
    wlogger.error(`Error in rawtransactions.ts/decodeScriptSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Decode a raw transaction from hex to assembly.
// POST bulk
async function decodeScriptBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const hexes: string[] = req.body.hexes

    // Validation
    if (!Array.isArray(hexes)) {
      res.status(400)
      return res.json({ error: "hexes must be an array" })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, hexes)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each hex in the array
    for (let i: number = 0; i < hexes.length; i++) {
      const hex: string = hexes[i]

      // Throw an error if hex is empty.
      if (!hex || hex === "") {
        res.status(400)
        return res.json({ error: "Encountered empty hex" })
      }
    }

    // Loop through each hex and create an array of promises
    const promises: Promise<DecodedScriptInterface>[] = hexes.map(
      async (hex: string): Promise<DecodedScriptInterface> => {
        const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()
        requestConfig.data.id = "decodescript"
        requestConfig.data.method = "decodescript"
        requestConfig.data.params = [hex]

        return await BitboxHTTP(requestConfig)
      }
    )

    // Wait for all parallel promises to return.
    const resolved: any[] = await Promise.all(promises)

    // Retrieve the data from each resolved promise.
    const result: DecodedScriptInterface[] = resolved.map(
      (x: AxiosResponse): DecodedScriptInterface => x.data.result
    )

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeScript: `, err)
    wlogger.error(`Error in rawtransactions.ts/decodeScriptBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve raw transactions details from the full node.
async function getRawTransactionsFromNode(
  txid: string,
  verbose: number
): Promise<RawTransactionInterface> {
  try {
    const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()

    requestConfig.data.id = "getrawtransaction"
    requestConfig.data.method = "getrawtransaction"
    requestConfig.data.params = [txid, verbose]

    const response: any = await BitboxHTTP(requestConfig)

    return response.data.result
  } catch (err) {
    wlogger.error(`Error in rawtransactions.ts/getRawTransactionsFromNode().`)
    throw err
  }
}

// Get a JSON object breakdown of transaction details.
// POST
async function getRawTransactionBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let verbose: number = 0
    if (req.body.verbose) verbose = 1

    let txids: string[] = req.body.txids
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids must be an array" })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, txids)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each txid in the array.
    for (let i: number = 0; i < txids.length; i++) {
      const txid: string = txids[i]

      if (!txid || txid === "") {
        res.status(400)
        return res.json({ error: `Encountered empty TXID` })
      }

      if (txid.length !== 64) {
        res.status(400)
        return res.json({
          error: `parameter 1 must be of length 64 (not ${txid.length})`
        })
      }
    }

    // Loop through each txid and create an array of promises
    const promises: Promise<RawTransactionInterface>[] = txids.map(
      async (txid: string): Promise<RawTransactionInterface> => {
        return getRawTransactionsFromNode(txid, verbose)
      }
    )

    // Wait for all parallel promises to return.
    const axiosResult: any[] = await axios.all(promises)

    res.status(200)
    return res.json(axiosResult)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/getRawTransaction: `, err)
    wlogger.error(`Error in rawtransactions.ts/getRawTransactionBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Get a JSON object breakdown of transaction details.
// GET
async function getRawTransactionSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let verbose: number = 0
    if (req.query.verbose === "true") verbose = 1

    const txid: string = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    const data: RawTransactionInterface = await getRawTransactionsFromNode(
      txid,
      verbose
    )

    return res.json(data)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/getRawTransaction: `, err)
    wlogger.error(`Error in rawtransactions.ts/getRawTransactionSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Transmit a raw transaction to the BCH network.
async function sendRawTransactionBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    // Validation
    const hexes: string[] = req.body.hexes

    // Reject if input is not an array
    if (!Array.isArray(hexes)) {
      res.status(400)
      return res.json({ error: "hex must be an array" })
    }

    const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, hexes)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element
    for (let i: number = 0; i < hexes.length; i++) {
      const hex: string = hexes[i]

      if (hex === "") {
        res.status(400)
        return res.json({
          error: `Encountered empty hex`
        })
      }
    }

    // Dev Note CT 1/31/2019:
    // Sending the 'sendrawtrnasaction' RPC call to a full node in parallel will
    // not work. Testing showed that the full node will return the same TXID for
    // different TX hexes. I believe this is by design, to prevent double spends.
    // In parallel, we are essentially asking the node to broadcast a new TX before
    // it's finished broadcast the previous one. Serial execution is required.

    // How to send TX hexes in parallel the WRONG WAY:
    /*
          // Collect an array of promises.
          const promises = hexes.map(async (hex: any) => {
            requestConfig.data.id = "sendrawtransaction"
            requestConfig.data.method = "sendrawtransaction"
            requestConfig.data.params = [hex]

            return await BitboxHTTP(requestConfig)
          })

          // Wait for all parallel Insight requests to return.
          const axiosResult: Array<any> = await axios.all(promises)

          // Retrieve the data part of the result.
          const result = axiosResult.map(x => x.data.result)
          */

    // Sending them serially.
    const result: any[] = []
    for (let i: number = 0; i < hexes.length; i++) {
      const hex: string = hexes[i]

      requestConfig.data.id = "sendrawtransaction"
      requestConfig.data.method = "sendrawtransaction"
      requestConfig.data.params = [hex]

      const rpcResult: AxiosResponse = await BitboxHTTP(requestConfig)

      result.push(rpcResult.data.result)
    }

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in rawtransactions.ts/sendRawTransactionBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Transmit a raw transaction to the BCH network.
async function sendRawTransactionSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const hex: string = req.params.hex // URL parameter

    // Reject if input is not an array or a string
    if (typeof hex !== "string") {
      res.status(400)
      return res.json({ error: "hex must be a string" })
    }

    // Validation
    if (hex === "") {
      res.status(400)
      return res.json({
        error: `Encountered empty hex`
      })
    }

    const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()

    // RPC call
    requestConfig.data.id = "sendrawtransaction"
    requestConfig.data.method = "sendrawtransaction"
    requestConfig.data.params = [hex]

    const rpcResult: AxiosResponse = await BitboxHTTP(requestConfig)

    const result: any = rpcResult.data.result

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(
      `Error in rawtransactions.ts/sendRawTransactionSingle().`,
      err
    )

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

export default {
  router,
  getRawTransactionsFromNode,
  testableComponents: {
    root,
    decodeRawTransactionSingle,
    decodeRawTransactionBulk,
    decodeScriptSingle,
    decodeScriptBulk,
    getRawTransactionBulk,
    getRawTransactionSingle,
    sendRawTransactionBulk,
    sendRawTransactionSingle
  }
}
