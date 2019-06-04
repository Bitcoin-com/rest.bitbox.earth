// imports
import axios, { AxiosResponse } from "axios"
import { BITBOX } from "bitbox-sdk"
import * as express from "express"
import * as util from "util"
import { TransactionInterface } from "./interfaces/RESTInterfaces"
import { decodeError, validateArraySize } from "./route-utils"
import logger = require("./logging.js")
import wlogger = require("../../util/winston-logging")

// consts
const router: any = express.Router()
const bitbox: BITBOX = new BITBOX()

util.inspect.defaultOptions = { depth: 3 }

// Manipulates and formats the raw data comming from Insight API.
const processInputs = (tx: TransactionInterface): any => {
  // Add legacy and cashaddr to tx vin
  if (tx.vin) {
    tx.vin.forEach(
      (vin: any): any => {
        if (!vin.coinbase) {
          vin.value = vin.valueSat
          const address: string = vin.addr
          if (address) {
            vin.legacyAddress = bitbox.Address.toLegacyAddress(address)
            vin.cashAddress = bitbox.Address.toCashAddress(address)
            delete vin.addr
          }
          delete vin.valueSat
          delete vin.doubleSpentTxID
        }
      }
    )
  }

  // Add legacy and cashaddr to tx vout
  if (tx.vout) {
    tx.vout.forEach(
      (vout: any): any => {
        // Overwrite value string with value in satoshis
        //vout.value = parseFloat(vout.value) * 100000000

        if (vout.scriptPubKey) {
          if (vout.scriptPubKey.addresses) {
            const cashAddrs: string[] = []
            vout.scriptPubKey.addresses.forEach((addr: any) => {
              const cashAddr = bitbox.Address.toCashAddress(addr)
              cashAddrs.push(cashAddr)
            })
            vout.scriptPubKey.cashAddrs = cashAddrs
          }
        }
      }
    )
  }
}

router.get("/", root)
router.post("/details", detailsBulk)
router.get("/details/:txid", detailsSingle)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "transaction" })
}

// Retrieve transaction data from the Insight API
// This function is also used by the SLP route library.
async function transactionsFromInsight(txid: string): Promise<any> {
  try {
    let path: string = `${process.env.BITCOINCOM_BASEURL}tx/${txid}`

    // Query the Insight server.
    const response: AxiosResponse = await axios.get(path)
    //console.log(`Insight output: ${JSON.stringify(response.data, null, 2)}`)

    // Parse the data.
    const parsed: any = response.data
    if (parsed) processInputs(parsed)

    return parsed
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

async function detailsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const txids: string[] = req.body.txids

    // Reject if address is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids needs to be an array" })
    }

    // Enforce array size rate limits
    if (!validateArraySize(req, txids)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    logger.debug(`Executing transaction/details with these txids: `, txids)

    // Collect an array of promises
    const promises: Promise<any>[] = txids.map(async (txid: any) => {
      return await transactionsFromInsight(txid)
    })

    // Wait for all parallel promises to return.
    const result: Promise<any>[] = await Promise.all(promises)

    // Return the array of retrieved transaction information.
    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in transactions.ts/detailsBulk().`, err)

    //console.log(`Error in transaction details: `, err)
    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function detailsSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const txid: string = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(txid)) {
      res.status(400)
      return res.json({
        error: "txid can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(
      `Executing transaction.ts/detailsSingle with this txid: `,
      txid
    )

    // Query the Insight API.
    const retData: Promise<any> = await transactionsFromInsight(txid)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retData)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in transactions.ts/detailsSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

export default {
  router,
  transactionsFromInsight,
  testableComponents: {
    root,
    detailsBulk,
    detailsSingle
  }
}
