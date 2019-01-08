/*
  TESTS FOR THE SLP.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const slpRoute = require("../../dist/routes/v2/slp")
const nock = require("nock") // HTTP mocking

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/slp-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#SLP", () => {
  let req, res

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITDB_URL: process.env.BITDB_URL
    }

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit")
      process.env.BITDB_URL = "http://fakeurl/api/"
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes

    // Explicitly reset the parmas and body.
    req.body = {}
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
    process.env.BITDB_URL = originalEnvVars.BITDB_URL
  })

  describe("#root", async () => {
    // root route handler.
    const root = slpRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "slp", "Returns static string")
    })
  })

  describe("list()", () => {
    // list route handler
    const list = slpRoute.testableComponents.list

    it("should throw 500 when network issues", async () => {
      // Save the existing BITDB_URL.
      const savedUrl2 = process.env.BITDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.BITDB_URL = "http://fakeurl/api/"

      const result = await list(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.BITDB_URL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET list", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITDB_URL}`)
          .post(``)
          .reply(200, { result: mockData.mockList })
      }

      const result = await list(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "id",
        "timestamp",
        "symbol",
        "name",
        "document"
      ])
    })
  })
})