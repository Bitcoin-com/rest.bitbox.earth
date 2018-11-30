/*
  TESTS FOR THE TRANSACTION.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const transactionRoute = require("../../dist/routes/v2/transaction")
const nock = require("nock") // HTTP mocking

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/transaction-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#Transactions", () => {
  let req, res

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit") {
      process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"
      process.env.RPC_BASEURL = "http://fakeurl/api"
      process.env.RPC_USERNAME = "fakeusername"
      process.env.RPC_PASSWORD = "fakepassword"
    }
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}

    // Activate nock if it's inactive.
    if (!nock.isActive()) nock.activate()
  })

  afterEach(() => {
    // Clean up HTTP mocks.
    nock.cleanAll() // clear interceptor list.
    nock.restore()
  })

  after(() => {
    // Restore any pre-existing environment variables.
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.RPC_BASEURL = originalEnvVars.RPC_BASEURL
    process.env.RPC_USERNAME = originalEnvVars.RPC_USERNAME
    process.env.RPC_PASSWORD = originalEnvVars.RPC_PASSWORD
  })

  describe("#root", async () => {
    // root route handler.
    const root = transactionRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "transaction", "Returns static string")
    })
  })

  describe("#details", async () => {
    const details = transactionRoute.testableComponents.details

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await details(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single txid", async () => {
      req.body = {
        txids: `6f235bd3a689f03c11969cd649ccad592462ca958bc519a30194e7a67b349a40`
      }

      const result = await details(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid txid", async () => {
      const fakeTXID = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/tx/${fakeTXID}`)
          .reply(400, {
            result: { error: "parameter 1 must be hexadecimal string" }
          })
      }

      req.body = {
        txids: [fakeTXID]
      }

      const result = await details(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
    })

    it("should process a single txid", async () => {
      const txid = `6f235bd3a689f03c11969cd649ccad592462ca958bc519a30194e7a67b349a40`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/tx/${txid}`)
          .reply(200, mockData.mockDetails)
      }

      req.body = {
        txids: [txid]
      }

      const result = await details(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "txid",
        "version",
        "locktime",
        "vin",
        "vout",
        "blockhash",
        "blockheight",
        "confirmations",
        "time",
        "blocktime",
        "valueOut",
        "size",
        "valueIn",
        "fees"
      ])
    })

    it("should process a multiple txids", async () => {
      const txid1 = `6f235bd3a689f03c11969cd649ccad592462ca958bc519a30194e7a67b349a40`
      const txid2 = `8d4fd4dcaa9d8051dc7d862dc23d8aa23e20b77b9c928c49380685459caa7043`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/tx/${txid1}`)
          .reply(200, mockData.mockDetails)
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/tx/${txid2}`)
          .reply(200, mockData.mockDetails)
      }

      req.body = {
        txids: [txid1, txid2]
      }

      const result = await details(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "txid",
        "version",
        "locktime",
        "vin",
        "vout",
        "blockhash",
        "blockheight",
        "confirmations",
        "time",
        "blocktime",
        "valueOut",
        "size",
        "valueIn",
        "fees"
      ])
    })
  })
})