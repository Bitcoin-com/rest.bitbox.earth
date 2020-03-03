/*
  Definitions for v3 Address routes.
  See specification doc in /docs/v3/api-spec.md
*/

const util = require("util")

const BITBOX = require("bitbox-sdk").BITBOX
const bitbox = new BITBOX()

const express = require("express")
const router = express.Router()

const axios = require("axios")
const wlogger = require("../../util/winston-logging")

const Blockbook = require("./services/blockbook")
const blockbook = new Blockbook()

const RouteUtils = require("../../util/route-utils")
const routeUtils = new RouteUtils()

// A local global reference to 'this' of the instance of this Class.
let _this

class Address {
  constructor() {
    _this = this

    // Bring global libraries into the instance of this Class.
    // Makes it easier to mock for unit tests.
    _this.bitbox = bitbox
    _this.axios = axios
    _this.blockbook = blockbook
    _this.routeUtils = routeUtils

    _this.router = router
    _this.router.get("/", this.root)
    _this.router.post("/balance", this.balance)
  }

  root(req, res, next) {
    return res.json({ status: "address-v3" })
  }

  // Get the BCH balance for an array of addresses.
  // curl -X POST "http://localhost:3000/v3/address/balance" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"addresses\":[\"bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7\",\"bitcoincash:qpdh9s677ya8tnx7zdhfrn8qfyvy22wj4qa7nwqa5v\"]}"
  async balance(req, res, next) {
    try {
      const addresses = req.body.addresses

      // Reject if addresses is not an array.
      if (!Array.isArray(addresses)) {
        res.status(400)
        return res.json({
          error: "addresses needs to be an array."
        })
      }

      // Enforce array size rate limits
      if (!routeUtils.validateArraySize(req, addresses)) {
        res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
        return res.json({
          error: "Array too large."
        })
      }

      const balances = addresses.map(async (address, index) =>
        // console.log(`address: ${address}`)
        // balanceFromBlockbook(address)
        _this.blockbook.balance(address)
      )

      const result = await Promise.all(balances)

      // const val = await _this.blockbook.

      res.status(200)
      return res.json(result)
    } catch (err) {
      // Attempt to decode the error message.
      const { msg, status } = _this.routeUtils.decodeError(err)
      if (msg) {
        res.status(status)
        return res.json({ error: msg })
      }

      //logger.error(`Error in detailsBulk(): `, err)
      wlogger.error(`Error in address-new.js/balance().`, err)

      res.status(500)
      return res.json({ error: util.inspect(err) })
    }
  }
}

module.exports = Address
