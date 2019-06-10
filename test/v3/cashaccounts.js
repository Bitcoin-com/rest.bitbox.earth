/*
  TESTS FOR THE cashaccounts.JS LIBRARY

*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const cashaccountsRoute = require("../../dist/routes/v2/cashaccounts")
const nock = require("nock") // HTTP mocking

let originalUrl // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
// const mockData = require("./mocks/cashaccounts-mock")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#cashaccountsRouter", () => {
  let req, res

  before(() => {
    originalUrl = process.env.CASHACCOUNT_LOOKUPSERVER

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "integration"
    if (process.env.TEST === "integration")
      process.env.CASHACCOUNT_LOOKUPSERVER = "https://cashaccounts.bchdata.cash"
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
    process.env.CASHACCOUNT_LOOKUPSERVER = originalUrl
  })

  describe("#root", () => {
    // root route handler.
    const { root } = cashaccountsRoute.testableComponents

    it("should respond to GET for base route", async () => {
      const result = root(req, res)

      assert.equal(result.status, "cashaccount", "Returns static string")
    })
  })

  describe("#lookup", () => {
    // details route handler.
    const { lookup } = cashaccountsRoute.testableComponents

    it("should throw 400 if account is empty", async () => {
      const result = await lookup(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "account name can not be empty")
    })

    it("should throw 400 if number is empty", async () => {
      req.params.account = "test"
      const result = await lookup(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "number can not be empty")
    })

    it("should throw 500 if handle is invalid", async () => {
      req.params.account = "test"
      req.params.number = "344a"
      const result = await lookup(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(
        result.error,
        "No account could be found with the requested parameters."
      )
    })

    it("should throw 500 if handle is valid but not found", async () => {
      req.params.account = "Jonathan"
      req.params.number = "111"
      const result = await lookup(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(
        result.error,
        "No account could be found with the requested parameters."
      )
    })

    it("return success object if account is valid", async () => {
      req.params.account = "Jonathan"
      req.params.number = "100"
      const result = await lookup(req, res)

      // Assert that required fields exist in the returned object.
      assert.exists(result.identifier)
      assert.exists(result.information)
    })
  })

  describe("#check", () => {
    // details route handler.
    const { check } = cashaccountsRoute.testableComponents

    it("should throw 400 if account is empty", async () => {
      const result = await check(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "account name can not be empty")
    })

    it("should throw 400 if number is empty", async () => {
      req.params.account = "test"
      const result = await check(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "number can not be empty")
    })

    it("should throw 500 if handle is invalid", async () => {
      req.params.account = "test"
      req.params.number = "344a"
      const result = await check(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Not a valid CashAccount")
    })

    it("should throw 500 if handle is valid but not found", async () => {
      req.params.account = "Jonathan"
      req.params.number = "111"
      const result = await check(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(
        result.error,
        "No account matched the requested parameters."
      )
    })

    it("return success object if account is valid", async () => {
      req.params.account = "Jonathan"
      req.params.number = "100"
      const result = await check(req, res)

      // Assert that required fields exist in the returned object.
      assert.exists(result.identifier)
      assert.exists(result.results)
      assert.exists(result.block)
    })
  })

  describe("#reverseLookup", () => {
    // details route handler.
    const { reverseLookup } = cashaccountsRoute.testableComponents

    it("should throw 400 if address is empty", async () => {
      const result = await reverseLookup(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should warn if using a bad address", async () => {
      req.params.address = "bitcoincash:ljqgqqj64s9la9"
      const result = await reverseLookup(req, res)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Not a valid BCH address.")
    })

    it("should return results with valid address", async () => {
      req.params.address =
        "bitcoincash:qrhncn6hgkhljqg4fuq4px5qg74sjz9fqqj64s9la9"
      const result = await reverseLookup(req, res)

      // Assert that required fields exist in the returned object.
      assert.exists(result.results)
    })
  })
})
