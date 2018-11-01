"use strict"

import * as express from "express"
import * as requestUtils from "./services/requestUtils";
import * as bitbox from "./services/bitbox";

import axios from "axios"

const router: express.Router = express.Router();
const BitboxHTTP = bitbox.getInstance();

const RateLimit = require("express-rate-limit")

interface IRLConfig {
  [blockRateLimit1: string]: any
  blockRateLimit2: any
  blockRateLimit3: any
}

const config: IRLConfig = {
  blockRateLimit1: undefined,
  blockRateLimit2: undefined,
  blockRateLimit3: undefined
}

let i = 1
while (i < 4) {
  config[`blockRateLimit${i}`] = new RateLimit({
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
  config.blockRateLimit1,
  async (
    req,
    res,
    next
  ) => {
    res.json({ status: "block" })
  }
)

router.get(
  "/detailsByHash/:hash",
  config.blockRateLimit2,
  async (
    req,
    res,
    next
  ) => {
    try {
      const response = await axios.get(
        `${process.env.BITCOINCOM_BASEURL}block/${req.params.hash}`
      )
      const parsed = response.data
      res.json(parsed)
    } catch (error) {
      res.status(500)
      return res.send(error)
    }
  }
)

router.get(
  "/detailsByHeight/:height",
  config.blockRateLimit2,
  async (
    req,
    res,
    next
  ) => {
    const requestConfig = requestUtils.getRequestConfig("getblockhash", [ parseInt(req.params.height) ]);

    BitboxHTTP(requestConfig)
      .then(async response => {
        try {
          const rsp = await axios.get(
            `${process.env.BITCOINCOM_BASEURL}block/${response.data.result}`
          )
          const parsed = rsp.data
          res.json(parsed)
        } catch (error) {
          res.status(500)
          return res.send(error)
        }
      })
      .catch(error => {
        res.status(500)
        return res.send(error)
      })
  }
)

module.exports = router
