// imports
import * as chai from "chai"
// Libraries under test
// TODO: Confirm routeRateLimit below doesn't need to be declared for each test.
import { routeRateLimit } from "./../../../src/middleware/route-ratelimit"
import controlV2 from "./../../../src/routes/v2/control"

// consts
const assert = chai.assert
const nock = require("nock") // HTTP mocking

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

// Mocking data.
const { mockReq, mockRes, mockNext } = require("./../mocks/express-mocks")
const mockData = require("./../mocks/address-mock")

let req: any
let res: any
let next: any
let originalEnvVars: any // Used during transition from integration to unit tests.

describe("#route-ratelimits", () => {
  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes
    next = mockNext

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}
  })

  describe("#routeRateLimit", () => {
    const getInfo = controlV2.testableComponents.getInfo

    it("should pass through rate-limit middleware", async () => {
      req.baseUrl = "/v2"
      req.path = "/control/getInfo"
      req.method = "GET"

      await routeRateLimit(req, res, next)

      // next() will be called if rate-limit is not triggered
      assert.equal(next.called, true)
    })

    it("should trigger rate-limit handler if rate limits exceeds 60 request per minute", async () => {
      req.baseUrl = "/v2"
      req.path = "/control/getInfo"
      req.method = "GET"

      for (let i = 0; i < 65; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        `next should not be called if rate limit was triggered.`
      )
    })

    it("should NOT trigger rate-limit handler for pro-tier at 65 RPM", async () => {
      // Clear the require cache before running this test.
      delete require.cache[
        require.resolve("../../dist/middleware/route-ratelimit")
      ]
      // routeRateLimit = require("../../dist/middleware/route-ratelimit")
      // routeRateLimit = routeRateLimit.routeRateLimit

      req.baseUrl = "/v2"
      req.path = "/control/getInfo"
      req.method = "GET"

      req.locals.proLimit = true

      //console.log(`req.locals before test: ${util.inspect(req.locals)}`)

      // Prepare the authorization header
      //req.headers.authorization = generateAuthHeader("BITBOX")

      for (let i = 0; i < 65; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      //console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        true,
        `next should be called if rate limit was not triggered.`
      )
    })

    it("rate-limiting should still kick in at a higher RPM for pro-tier", async () => {
      // Clear the require cache before running this test.
      delete require.cache[
        require.resolve("../../dist/middleware/route-ratelimit")
      ]
      // routeRateLimit = require("../../dist/middleware/route-ratelimit")
      // routeRateLimit = routeRateLimit.routeRateLimit

      req.baseUrl = "/v2"
      req.path = "/control/getInfo"
      req.method = "GET"

      req.locals.proLimit = true

      //console.log(`req.locals before test: ${util.inspect(req.locals)}`)

      // Prepare the authorization header
      //req.headers.authorization = generateAuthHeader("BITBOX")

      for (let i = 0; i < 650; i++) {
        next.reset() // reset the stubbed next() function.

        await routeRateLimit(req, res, next)
        //console.log(`next() called: ${next.called}`)
      }

      //console.log(`req.locals after test: ${util.inspect(req.locals)}`)

      // Note: next() will be called unless the rate-limit kicks in.
      assert.equal(
        next.called,
        false,
        `next should NOT be called if rate limit was triggered.`
      )
    })
  })
})

// Generates a Basic authorization header.
function generateAuthHeader(pass: any) {
  // https://en.wikipedia.org/wiki/Basic_access_authentication
  const username = "BITBOX"
  const combined = `${username}:${pass}`

  var base64Credential = Buffer.from(combined).toString("base64")
  var readyCredential = `Basic ${base64Credential}`

  return readyCredential
}
