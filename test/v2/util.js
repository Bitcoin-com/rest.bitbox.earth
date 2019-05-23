/*
  TESTS FOR THE UTIL.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const utilRoute = require("../../dist/routes/v2/util")
const nock = require("nock") // HTTP mocking

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/util-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#Util", () => {
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
    const root = utilRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "util", "Returns static string")
    })
  })

  describe("#validateAddressSingle", async () => {
    const validateAddress = utilRoute.testableComponents.validateAddressSingle

    it("should throw an error for an empty address", async () => {
      const result = await validateAddress(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be empty",
        "Proper error message"
      )
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.address = `bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y`

      const result = await validateAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should validate address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockAddress })
      }

      req.params.address = `bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y`

      const result = await validateAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "isvalid",
        "address",
        "scriptPubKey",
        "ismine",
        "iswatchonly",
        "isscript"
      ])
    })
  })

  describe("#validateAddressBulk", async () => {
    const validateAddressBulk = utilRoute.testableComponents.validateAddressBulk

    it("should throw an error for an empty body", async () => {
      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array. Use GET for single address.",
        "Proper error message"
      )
    })

    it("should error on non-array single address", async () => {
      req.body = {
        addresses: `bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y`
      }

      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array. Use GET for single address.",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result = await validateAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should error on invalid address", async () => {
      req.body = {
        addresses: [`bchtest:qqqk4y6lsl5da64sg5qc3xezmpl`]
      }

      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address. Double check your address is valid",
        "Proper error message"
      )
    })

    it("should error on mainnet address when using testnet", async () => {
      req.body = {
        addresses: [`bitcoincash:qrcc3jsqpgwqcdru70sk54sd0g3l04q7c53ycm6ucj`]
      }

      const result = await validateAddressBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid network. Trying to use a testnet address on mainnet, or vice versa.",
        "Proper error message"
      )
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.body.addresses = [
        `bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y`
      ]

      const result = await validateAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
    })

    it("should validate a single address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockAddress })
      }

      req.body.addresses = [
        `bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y`
      ]

      const result = await validateAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "isvalid",
        "address",
        "scriptPubKey",
        "ismine",
        "iswatchonly",
        "isscript"
      ])
    })

    it("should validate a multiple addresses", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .times(2)
          .reply(200, { result: mockData.mockAddress })
      }

      req.body.addresses = [
        `bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y`,
        `bchtest:qqqk4y6lsl5da64sg5qc3xezmplyu5kmpyz2ysaa5y`
      ]

      const result = await validateAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "isvalid",
        "address",
        "scriptPubKey",
        "ismine",
        "iswatchonly",
        "isscript"
      ])
    })
  })
})
