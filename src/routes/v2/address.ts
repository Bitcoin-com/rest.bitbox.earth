// imports
import axios, { AxiosResponse } from "axios"
import { BITBOX } from "bitbox-sdk"
import * as express from "express"
import * as util from "util"
import { wlogger } from "../../util/winston-logging"
import {
  AddressDetailsInterface,
  AddressUTXOsInterface,
  TransactionsInterface,
  UTXOsInterface
} from "./interfaces/RESTInterfaces"
import { decodeError, validateArraySize, validateNetwork } from "./route-utils"
import logger = require("./logging.js")

// consts
const router: express.Router = express.Router()
const bitbox: BITBOX = new BITBOX()
const SLPSDK: any = require("slp-sdk")
const SLP: any = new SLPSDK()
let Utils = SLP.slpjs.Utils

// Used for processing error messages before sending them to the user.
util.inspect.defaultOptions = { depth: 1 }

// Use the default (and max) page size of 1000
// https://github.com/bitpay/insight-api#notes-on-upgrading-from-v03
const PAGE_SIZE: number = 1000

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/details/:address", detailsSingle)
router.post("/details", detailsBulk)
router.get("/utxo/:address", utxoSingle)
router.post("/utxo", utxoBulk)
router.get("/unconfirmed/:address", unconfirmedSingle)
router.post("/unconfirmed", unconfirmedBulk)
router.get("/transactions/:address", transactionsSingle)
router.post("/transactions", transactionsBulk)
router.get("/fromXPub/:xpub", fromXPubSingle)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "address" })
}

// Query the Insight API for details on a single BCH address.
// Returns a Promise.
async function detailsFromInsight(
  thisAddress: string,
  currentPage: number = 0
): Promise<AddressDetailsInterface> {
  try {
    let addr: string
    if (
      process.env.BITCOINCOM_BASEURL === "https://bch-insight.bitpay.com/api/"
    ) {
      addr = bitbox.Address.toCashAddress(thisAddress)
    } else {
      addr = bitbox.Address.toLegacyAddress(thisAddress)
    }

    let path: string = `${process.env.BITCOINCOM_BASEURL}addr/${addr}`

    // Set from and to params based on currentPage and pageSize
    // https://github.com/bitpay/insight-api/blob/master/README.md#notes-on-upgrading-from-v02
    const from: number = currentPage * PAGE_SIZE
    const to: number = from + PAGE_SIZE
    path = `${path}?from=${from}&to=${to}`

    // Query the Insight server.
    const axiosResponse: AxiosResponse = await axios.get(path)
    const retData: AddressDetailsInterface = axiosResponse.data

    // Calculate pagesTotal from response
    const pagesTotal: number = Math.ceil(retData.txApperances / PAGE_SIZE)

    // Append different address formats to the return data.
    retData.legacyAddress = bitbox.Address.toLegacyAddress(retData.addrStr)
    retData.cashAddress = bitbox.Address.toCashAddress(retData.addrStr)
    retData.slpAddress = Utils.toSlpAddress(retData.cashAddress)
    delete retData.addrStr

    // Append pagination information to the return data.
    retData.currentPage = currentPage
    retData.pagesTotal = pagesTotal

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// GET handler for single address details
async function detailsSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const address: string = req.params.address
    const currentPage: number = req.query.page
      ? parseInt(req.query.page, 10)
      : 0

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

    logger.debug(`Executing address/detailsSingle with this address: `, address)
    wlogger.debug(
      `Executing address/detailsSingle with this address: `,
      address
    )

    // Ensure the input is a valid BCH address.
    try {
      bitbox.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid: boolean = validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Insight API.
    let retData: AddressDetailsInterface = await detailsFromInsight(
      address,
      currentPage
    )

    // Return the retrieved address information.
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
    //logger.error(`Error in address.ts/detailsSingle: `, err)
    wlogger.error(`Error in address.ts/detailsSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// POST handler for bulk queries on address details
async function detailsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let addresses: string[] = req.body.addresses
    const currentPage: number = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if addresses is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: "addresses needs to be an array. Use GET for single address."
      })
    }

    // Enforce array size rate limits
    if (!validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    logger.debug(`Executing address/details with these addresses: `, addresses)
    wlogger.debug(`Executing address/details with these addresses: `, addresses)

    // Validate each element in the address array.
    for (let i: number = 0; i < addresses.length; i++) {
      const thisAddress: string = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bitbox.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid: boolean = validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    let addressPromises: Promise<AddressDetailsInterface>[] = addresses.map(
      async (address: any): Promise<AddressDetailsInterface> => {
        return detailsFromInsight(address, currentPage)
      }
    )

    // Wait for all parallel Insight requests to return.
    let result: AddressDetailsInterface[] = await axios.all(addressPromises)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    //logger.error(`Error in detailsBulk(): `, err)
    wlogger.error(`Error in address.ts/detailsBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve UTXO data from the Insight API
async function utxoFromInsight(
  thisAddress: string
): Promise<AddressUTXOsInterface> {
  try {
    let addr: string
    if (
      process.env.BITCOINCOM_BASEURL === "https://bch-insight.bitpay.com/api/"
    ) {
      addr = bitbox.Address.toCashAddress(thisAddress)
    } else {
      addr = bitbox.Address.toLegacyAddress(thisAddress)
    }

    const path: string = `${process.env.BITCOINCOM_BASEURL}addr/${addr}/utxo`

    // Query the Insight server.
    const response: AxiosResponse = await axios.get(path)

    // Append different address formats to the return data.
    const retData: AddressUTXOsInterface = {
      utxos: [],
      legacyAddress: "",
      cashAddress: "",
      slpAddress: "",
      scriptPubKey: ""
    }
    if (response.data.length && response.data[0].scriptPubKey) {
      let spk = response.data[0].scriptPubKey
      retData.scriptPubKey = spk
    }
    retData.legacyAddress = bitbox.Address.toLegacyAddress(thisAddress)
    retData.cashAddress = bitbox.Address.toCashAddress(thisAddress)
    retData.slpAddress = Utils.toSlpAddress(retData.cashAddress)
    retData.utxos = response.data.map(
      (utxo: UTXOsInterface): UTXOsInterface => {
        delete utxo.address
        delete utxo.scriptPubKey
        return utxo
      }
    )
    //console.log(`utxoFromInsight retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// GET handler for single address details
async function utxoSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const address: string = req.params.address
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

    logger.debug(`Executing address/utxoSingle with this address: `, address)
    wlogger.debug(`Executing address/utxoSingle with this address: `, address)

    // Ensure the input is a valid BCH address.
    try {
      bitbox.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid: boolean = validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Insight API.
    const retData: AddressUTXOsInterface = await utxoFromInsight(address)

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
    wlogger.error(`Error in address.ts/utxoSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve UTXO information for an address.
async function utxoBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let addresses: string[] = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    // Enforce array size rate limits
    if (!validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element in the address array.
    for (let i: number = 0; i < addresses.length; i++) {
      const thisAddress: string = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bitbox.Address.toLegacyAddress(thisAddress)
      } catch (er) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid: boolean = validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    logger.debug(`Executing address/utxoBulk with these addresses: `, addresses)
    wlogger.debug(
      `Executing address/utxoBulk with these addresses: `,
      addresses
    )

    // Loops through each address and creates an array of Promises, querying
    // Insight API in parallel.
    let addressPromises: Promise<AddressUTXOsInterface>[] = addresses.map(
      async (address: string): Promise<AddressUTXOsInterface> => {
        return utxoFromInsight(address)
      }
    )

    // Wait for all parallel Insight requests to return.
    let result: AddressUTXOsInterface[] = await axios.all(addressPromises)

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/utxoBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function unconfirmedSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const address: string = req.params.address
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

    logger.debug(`Executing address/utxoSingle with this address: `, address)
    wlogger.debug(`Executing address/utxoSingle with this address: `, address)

    // Ensure the input is a valid BCH address.
    try {
      bitbox.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid: boolean = validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Insight API.
    const retData: AddressUTXOsInterface = await utxoFromInsight(address)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Loop through each returned UTXO.
    const unconfirmedUTXOs: UTXOsInterface[] = []
    for (let j: number = 0; j < retData.utxos.length; j++) {
      const thisUtxo: UTXOsInterface = retData.utxos[j]

      // Only interested in UTXOs with no confirmations.
      if (thisUtxo.confirmations === 0) unconfirmedUTXOs.push(thisUtxo)
    }

    retData.utxos = unconfirmedUTXOs

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
    wlogger.error(`Error in address.ts/unconfirmedSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve any unconfirmed TX information for a given address.
async function unconfirmedBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let addresses: string[] = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    logger.debug(`Executing address/utxo with these addresses: `, addresses)
    wlogger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Enforce array size rate limits
    if (!validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element in the address array.
    for (let i: number = 0; i < addresses.length; i++) {
      const thisAddress: string = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bitbox.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid: boolean = validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Collect an array of promises.
    const promises: Promise<AddressUTXOsInterface>[] = addresses.map(
      (address: string): Promise<AddressUTXOsInterface> =>
        utxoFromInsight(address)
    )

    // Wait for all parallel Insight requests to return.
    let result: AddressUTXOsInterface[] = await axios.all(promises)

    // Loop through each result
    const finalResult: AddressUTXOsInterface[] = result.map(
      (elem: AddressUTXOsInterface): AddressUTXOsInterface => {
        //console.log(`elem: ${util.inspect(elem)}`)

        // Filter out confirmed transactions.
        const unconfirmedUtxos: UTXOsInterface[] = elem.utxos.filter(
          (utxo: UTXOsInterface): boolean => {
            return utxo.confirmations === 0
          }
        )

        elem.utxos = unconfirmedUtxos

        return elem
      }
    )

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(finalResult)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/unconfirmedBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Retrieve transaction data from the Insight API
async function transactionsFromInsight(
  thisAddress: string,
  currentPage: number = 0
): Promise<TransactionsInterface> {
  try {
    const path: string = `${
      process.env.BITCOINCOM_BASEURL
    }txs/?address=${thisAddress}&pageNum=${currentPage}`

    // Query the Insight server.
    const response: AxiosResponse = await axios.get(path)

    // Append different address formats to the return data.
    const retData: TransactionsInterface = response.data
    retData.legacyAddress = bitbox.Address.toLegacyAddress(thisAddress)
    retData.cashAddress = bitbox.Address.toCashAddress(thisAddress)
    retData.currentPage = currentPage

    return retData
  } catch (err) {
    // Dev Note: Do not log error messages here. Throw them instead and let the
    // parent function handle it.
    throw err
  }
}

// Get an array of TX information for a given address.
async function transactionsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let addresses: string[] = req.body.addresses
    const currentPage: number = req.body.page ? parseInt(req.body.page, 10) : 0

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    logger.debug(`Executing address/utxo with these addresses: `, addresses)
    wlogger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Enforce array size rate limits
    if (!validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element in the address array.
    for (let i: number = 0; i < addresses.length; i++) {
      const thisAddress: string = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bitbox.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid: boolean = validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network for address ${thisAddress}. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    // Loop through each address and collect an array of promises.
    let addressPromises: Promise<TransactionsInterface>[] = addresses.map(
      async (address: string): Promise<TransactionsInterface> => {
        return transactionsFromInsight(address, currentPage)
      }
    )

    // Wait for all parallel Insight requests to return.
    let result: TransactionsInterface[] = await axios.all(addressPromises)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/transactionsBulk().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function transactionsSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const address: string = req.params.address
    const currentPage: number = req.query.page
      ? parseInt(req.query.page, 10)
      : 0

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

    logger.debug(
      `Executing address/transactionsSingle with this address: `,
      address
    )
    wlogger.debug(
      `Executing address/transactionsSingle with this address: `,
      address
    )

    // Ensure the input is a valid BCH address.
    try {
      bitbox.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid BCH address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid: boolean = validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Insight API.
    const retData: TransactionsInterface = await transactionsFromInsight(
      address,
      currentPage
    )

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
    wlogger.error(`Error in address.ts/transactionsSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function fromXPubSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const xpub: string = req.params.xpub
    const hdPath: string = req.query.hdPath ? req.query.hdPath : "0"

    if (!xpub || xpub === "") {
      res.status(400)
      return res.json({ error: "xpub can not be empty" })
    }

    // Reject if xpub is an array.
    if (Array.isArray(xpub)) {
      res.status(400)
      return res.json({
        error: "xpub can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/fromXPub with this xpub: `, xpub)
    wlogger.debug(`Executing address/fromXPub with this xpub: `, xpub)

    let cashAddr: string = bitbox.Address.fromXPub(xpub, hdPath)
    let legacyAddr: string = bitbox.Address.toLegacyAddress(cashAddr)
    res.status(200)
    return res.json({
      cashAddress: cashAddr,
      legacyAddress: legacyAddr
    })
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/fromXPubSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

export default {
  router,
  testableComponents: {
    root,
    detailsBulk,
    detailsSingle,
    utxoBulk,
    utxoSingle,
    unconfirmedBulk,
    unconfirmedSingle,
    transactionsBulk,
    transactionsSingle,
    fromXPubSingle
  }
}
