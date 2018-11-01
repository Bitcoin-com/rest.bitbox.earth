"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const RateLimit = require("express-rate-limit")

const BITBOXCli = require("bitbox-cli/lib/bitbox-cli").default
const BITBOX = new BITBOXCli()

interface IRLConfig {
  [transactionRateLimit1: string]: any
  transactionRateLimit2: any
}

const config: IRLConfig = {
  transactionRateLimit1: undefined,
  transactionRateLimit2: undefined
}

const processInputs = (tx: any) => {
  if (tx.vin) {
    tx.vin.forEach((vin: any) => {
      if (!vin.coinbase) {
        const address = vin.addr
        vin.legacyAddress = BITBOX.Address.toLegacyAddress(address)
        vin.cashAddress = BITBOX.Address.toCashAddress(address)
        vin.value = vin.valueSat
        delete vin.addr
        delete vin.valueSat
        delete vin.doubleSpentTxID
      }
    })
  }
}

let i = 1
while (i < 3) {
  config[`transactionRateLimit${i}`] = new RateLimit({
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

router.get(
  "/",
  config.transactionRateLimit1,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.json({ status: "transaction" })
  }
)

router.get(
  "/details/:txid",
  config.transactionRateLimit1,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let txs = JSON.parse(req.params.txid)
      if (txs.length > 20) {
        res.json({
          error: "Array too large. Max 20 txids"
        })
      }

      const result = [] as any
      txs = txs.map((tx: any) =>
        axios.get(`${process.env.BITCOINCOM_BASEURL}tx/${tx}`)
      )
      axios.all(txs).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            let tmp = {} as any
            const parsed = tmp.data.result
            result.push(parsed)
          }
          result.forEach((tx: any) => {
            processInputs(tx)
          })
          res.json(result)
        })
      )
    } catch (error) {
      axios
        .get(`${process.env.BITCOINCOM_BASEURL}tx/${req.params.txid}`)
        .then(response => {
          const parsed = response.data
          if (parsed) processInputs(parsed)

          res.json(parsed)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

module.exports = router
