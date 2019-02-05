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
  let req, res, mockServerUrl

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITDB_URL: process.env.BITDB_URL
    }

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit") {
      process.env.BITDB_URL = "http://fakeurl/"
      mockServerUrl = `http://fakeurl`
    }
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

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })
    /*
    it("should GET list", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        const b64 = `eyJ2IjozLCJxIjp7ImZpbmQiOnsib3V0LmgxIjoiNTM0YzUwMDAiLCJvdXQuczMiOiJHRU5FU0lTIn0sImxpbWl0IjoxMDAwfSwiciI6eyJmIjoiWyAuW10gfCB7IGlkOiAudHguaCwgdGltZXN0YW1wOiAoLmJsay50IHwgc3RyZnRpbWUoXCIlWS0lbS0lZCAlSDolTVwiKSksIHN5bWJvbDogLm91dFswXS5zNCwgbmFtZTogLm91dFswXS5zNSwgZG9jdW1lbnQ6IC5vdXRbMF0uczYgfSBdIn19`

        nock(mockServerUrl)
          .get(`/q/${b64}`)
          .reply(200, mockData.mockList)
      }

      const result = await list(req, res)
      //console.log(`test result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "id",
        "timestamp",
        "symbol",
        "name",
        "document"
      ])
    })
  */
  })

  describe("listSingleToken()", () => {
    const listSingleToken = slpRoute.testableComponents.listSingleToken

    it("should throw 400 if tokenId is empty", async () => {
      const result = await listSingleToken(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing BITDB_URL.
      const savedUrl2 = process.env.BITDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.BITDB_URL = "http://fakeurl/api/"

      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result = await listSingleToken(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.BITDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should get token information", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        const b64 = `eyJ2IjozLCJxIjp7ImZpbmQiOnsib3V0LmgxIjoiNTM0YzUwMDAiLCJvdXQuczMiOiJHRU5FU0lTIn0sImxpbWl0IjoxMDAwfSwiciI6eyJmIjoiWyAuW10gfCB7IGlkOiAudHguaCwgdGltZXN0YW1wOiAoLmJsay50IHwgc3RyZnRpbWUoXCIlWS0lbS0lZCAlSDolTVwiKSksIHN5bWJvbDogLm91dFswXS5zNCwgbmFtZTogLm91dFswXS5zNSwgZG9jdW1lbnQ6IC5vdXRbMF0uczYgfSBdIn19`

        nock(mockServerUrl)
          .get(`/q/${b64}`)
          .reply(200, mockData.mockList)
      }
      /*
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITDB_URL}`)
          .get(
            `q/eyJ2IjozLCJxIjp7ImZpbmQiOnsib3V0LmgxIjoiNTM0YzUwMDAiLCJvdXQuczMiOiJHRU5FU0lTIn0sImxpbWl0IjoxMDAwfSwiciI6eyJmIjoiWyAuW10gfCB7IGlkOiAudHguaCwgdGltZXN0YW1wOiAoLmJsay50IHwgc3RyZnRpbWUoXCIlWS0lbS0lZCAlSDolTVwiKSksIHN5bWJvbDogLm91dFswXS5zNCwgbmFtZTogLm91dFswXS5zNSwgZG9jdW1lbnQ6IC5vdXRbMF0uczYgfSBdIn19`
          )
          .reply(200, { result: mockData.mockList[0] })
      }
*/
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result = await listSingleToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "id",
        "timestamp",
        "symbol",
        "name",
        "document"
      ])
    })
  })

  describe("balancesForAddress()", () => {
    const balancesForAddress = slpRoute.testableComponents.balancesForAddress

    it("should throw 400 if address is empty", async () => {
      const result = await balancesForAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"

      const result = await balancesForAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"

      const result = await balancesForAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid")
    })
    //
    // it("should throw 503 when network issues", async () => {
    //   // Save the existing BITDB_URL.
    //   const savedUrl2 = process.env.BITDB_URL
    //
    //   // Manipulate the URL to cause a 500 network error.
    //   process.env.BITDB_URL = "http://fakeurl/api/"
    //
    //   req.params.address = "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5"
    //
    //   const result = await balancesForAddress(req, res)
    //   console.log(`result: ${util.inspect(result)}`)
    //
    //   // Restore the saved URL.
    //   process.env.BITDB_URL = savedUrl2
    //
    //   assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
    //   assert.include(
    //     result.error,
    //     "Network error: Could not communicate with full node",
    //     "Error message expected"
    //   )
    // })
  })

  describe("balancesForAddressByTokenID()", () => {
    const balancesForAddressByTokenID =
      slpRoute.testableComponents.balancesForAddressByTokenID

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
      const result = await balancesForAddressByTokenID(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if tokenId is empty", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
      req.params.tokenId = ""
      const result = await balancesForAddressByTokenID(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result = await balancesForAddressByTokenID(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"

      const result = await balancesForAddressByTokenID(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid")
    })
    //
    // it("should throw 503 when network issues", async () => {
    //   // Save the existing BITDB_URL.
    //   const savedUrl2 = process.env.BITDB_URL
    //
    //   // Manipulate the URL to cause a 500 network error.
    //   process.env.BITDB_URL = "http://fakeurl/api/"
    //
    //   req.params.address = "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5"
    //
    //   const result = await balancesForAddress(req, res)
    //   console.log(`result: ${util.inspect(result)}`)
    //
    //   // Restore the saved URL.
    //   process.env.BITDB_URL = savedUrl2
    //
    //   assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
    //   assert.include(
    //     result.error,
    //     "Network error: Could not communicate with full node",
    //     "Error message expected"
    //   )
    // })
  })

  describe("convertAddress()", () => {
    const convertAddress = slpRoute.testableComponents.convertAddress

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      const result = await convertAddress(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should convert address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITDB_URL}`)
          .post(``)
          .reply(200, { result: mockData.mockConvert })
      }

      req.params.address = "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5"

      const result = await convertAddress(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["cashAddress", "legacyAddress", "slpAddress"])
    })
  })
})
