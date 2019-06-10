/*
  Blockbook API route
*/

"use strict"

const express = require("express")
const axios = require("axios")
const routeUtils = require("./route-utils")
const wlogger = require("../../util/winston-logging")

const router = express.Router()

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BITBOXSDK = require("bitbox-sdk").BITBOX
const BITBOX = new BITBOXSDK()


//const BLOCKBOOK_URL = process.env.BLOCKBOOK_URL

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/balance/:address", balanceSingle)
router.post("/balance", balanceBulk)
router.get("/utxos/:address", utxosSingle)
router.post("/utxos", utxosBulk)

// Root API endpoint. Simply acknowledges that it exists.
function root(req, res, next) {
  return res.json({ status: "address" })
}

// Query the Blockbook Node API for a balance on a single BCH address.
// Returns a Promise.
async function balanceFromBlockbook(thisAddress) {
  try {
    //console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

    // Convert the address to a cashaddr without a prefix.
    const addr = BITBOX.Address.toCashAddress(thisAddress)

    const path = `${process.env.BLOCKBOOK_URL}api/v2/address/${addr}`

    // Query the Blockbook Node API.
    const axiosResponse = await axios.get(path)
    const retData = axiosResponse.data
    //console.log(`retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// GET handler for single balance
async function balanceSingle(req, res, next) {
  try {
    const address = req.params.address

    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    wlogger.debug(
      `Executing blockbook/balanceSingle with this address: `,
      address
    )

    // Ensure the input is a valid BCH address.
    try {
      const legacyAddr = BITBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Blockbook Node API.
    const retData = await balanceFromBlockbook(address)

    // Return the retrieved address information.
    res.status(200)
    return res.json(retData)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    wlogger.error(`Error in blockbook.js/balanceSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// POST handler for bulk queries on address details
async function balanceBulk(req, res, next) {
  try {
    let addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if addresses is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: "addresses needs to be an array. Use GET for single address."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    wlogger.debug(
      `Executing blockbook.js/balanceBulk with these addresses: `,
      addresses
    )

    // Validate each element in the address array.
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        BITBOX.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    addresses = addresses.map(async (address, index) =>
      balanceFromBlockbook(address)
    )

    // Wait for all parallel Insight requests to return.
    const result = await axios.all(addresses)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in blockbook.js/balanceBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Query the Blockbook API for utxos associated with a BCH address.
// Returns a Promise.
async function utxosFromBlockbook(thisAddress) {
  try {
    //console.log(`BLOCKBOOK_URL: ${BLOCKBOOK_URL}`)

    // Convert the address to a cashaddr without a prefix.
    const addr = BITBOX.Address.toCashAddress(thisAddress)

    const path = `${process.env.BLOCKBOOK_URL}api/v2/utxo/${addr}`

    // Query the Blockbook API.
    const axiosResponse = await axios.get(path)
    const retData = axiosResponse.data
    //console.log(`retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// GET handler for single balance
async function utxosSingle(req, res, next) {
  try {
    const address = req.params.address

    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    wlogger.debug(
      `Executing blockbook/utxosSingle with this address: `,
      address
    )

    // Ensure the input is a valid BCH address.
    try {
      const legacyAddr = BITBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Blockbook API.
    const retData = await utxosFromBlockbook(address)

    // Return the retrieved address information.
    res.status(200)
    return res.json(retData)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    wlogger.error(`Error in blockbook.js/utxosSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// POST handler for bulk queries on address utxos
async function utxosBulk(req, res, next) {
  try {
    let addresses = req.body.addresses
    const currentPage = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if addresses is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: "addresses needs to be an array. Use GET for single address."
      })
    }

    // Enforce array size rate limits
    if (!routeUtils.validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    wlogger.debug(
      `Executing blockbook.js/utxosBulk with these addresses: `,
      addresses
    )

    // Validate each element in the address array.
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        BITBOX.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    addresses = addresses.map(async (address, index) =>
      utxosFromBlockbook(address)
    )

    // Wait for all parallel Insight requests to return.
    const result = await axios.all(addresses)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in blockbook.js/utxosBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    balanceSingle,
    balanceBulk,
    utxosSingle,
    utxosBulk
  }
}
