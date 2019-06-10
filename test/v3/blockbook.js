/*
  TESTS FOR THE BLOCKBOOK.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const blockbookRoute = require("../../src/routes/v3/blockbook")
const nock = require("nock") // HTTP mocking

let originalUrl // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/blockbook-mock")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#Blockbook Router", () => {
  let req, res, mockServerUrl

  before(() => {
    originalUrl = process.env.BLOCKBOOK_URL

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit") {
      process.env.BLOCKBOOK_URL = "http://fakeurl/api/"
      mockServerUrl = `http://fakeurl`
    }
    // console.log(`Testing type is: ${process.env.TEST}`)
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
    process.env.BLOCKBOOK_URL = originalUrl
  })

  describe("#root", () => {
    // root route handler.
    const root = blockbookRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)

      assert.equal(result.status, "address", "Returns static string")
    })
  })

  describe("#Balance Single", () => {
    // details route handler.
    const balanceSingle = blockbookRoute.testableComponents.balanceSingle

    it("should throw 400 if address is empty", async () => {
      const result = await balanceSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should error on an array", async () => {
      req.params.address = [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]

      const result = await balanceSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.params.address = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      const result = await balanceSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.params.address = `bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`

      const result = await balanceSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.params.address = `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = "http://fakeurl/api/"

        const result = await balanceSingle(req, res)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })

    it("should get balance for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BLOCKBOOK_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockBalance)
      }

      // Call the details API.
      const result = await balanceSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "page",
        "totalPages",
        "itemsOnPage",
        "address",
        "balance",
        "totalReceived",
        "totalSent",
        "unconfirmedBalance",
        "unconfirmedTxs",
        "txs",
        "txids"
      ])
      assert.isArray(result.txids)
    })
  })

  describe("#Balance Bulk", () => {
    // details route handler.
    const balanceBulk = blockbookRoute.testableComponents.balanceBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await balanceBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single address", async () => {
      req.body = {
        address: `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`
      }

      const result = await balanceBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.body = {
        addresses: [`02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
      }

      const result = await balanceBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result = await balanceBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
      }

      const result = await balanceBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.body = {
          addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = "http://fakeurl/api/"

        const result = await balanceBulk(req, res)
        //console.log(`network issue result: ${util.inspect(result)}`)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.isAbove(res.statusCode, 499, "HTTP status code 500 expected.")
        //assert.include(result.error, "ENOTFOUND", "Error message expected")
        assert.include(
          result.error,
          "Network error: Could not communicate",
          "Error message expected"
        )
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })

    it("should get details for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockBalance)
      }

      // Call the details API.
      const result = await balanceBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "page",
        "totalPages",
        "itemsOnPage",
        "address",
        "balance",
        "totalReceived",
        "totalSent",
        "unconfirmedBalance",
        "unconfirmedTxs",
        "txs",
        "txids"
      ])
      assert.isArray(result[0].txids)
    })

    it("should get details for multiple addresses", async () => {
      req.body = {
        addresses: [
          `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`,
          `bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr`
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockBalance)
      }

      // Call the details API.
      const result = await balanceBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })
  })

  describe("#UTXOs Single", () => {
    // details route handler.
    const utxosSingle = blockbookRoute.testableComponents.utxosSingle

    it("should throw 400 if address is empty", async () => {
      const result = await utxosSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should error on an array", async () => {
      req.params.address = [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]

      const result = await utxosSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.params.address = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      const result = await utxosSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.params.address = `bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`

      const result = await utxosSingle(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.params.address = `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = "http://fakeurl/api/"

        const result = await utxosSingle(req, res)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })

    it("should get utxos for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BLOCKBOOK_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockUtxos)
      }

      // Call the details API.
      const result = await utxosSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "txid",
        "vout",
        "value",
        "height",
        "confirmations"
      ])
    })
  })

  describe("#UTXO Bulk", () => {
    // details route handler.
    const utxosBulk = blockbookRoute.testableComponents.utxosBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await utxosBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single address", async () => {
      req.body = {
        address: `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`
      }

      const result = await utxosBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.body = {
        addresses: [`02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
      }

      const result = await utxosBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result = await utxosBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
      }

      const result = await utxosBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BLOCKBOOK_URL

      try {
        req.body = {
          addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BLOCKBOOK_URL = "http://fakeurl/api/"

        const result = await utxosBulk(req, res)
        //console.log(`network issue result: ${util.inspect(result)}`)

        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl

        assert.isAbove(res.statusCode, 499, "HTTP status code 500 expected.")
        //assert.include(result.error, "ENOTFOUND", "Error message expected")
        assert.include(
          result.error,
          "Network error: Could not communicate",
          "Error message expected"
        )
      } catch (err) {
        // Restore the saved URL.
        process.env.BLOCKBOOK_URL = savedUrl
      }
    })

    it("should get details for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockUtxos)
      }

      // Call the details API.
      const result = await utxosBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isArray(result[0])
      assert.hasAnyKeys(result[0][0], [
        "txid",
        "vout",
        "value",
        "height",
        "confirmations"
      ])
    })

    it("should get details for multiple addresses", async () => {
      req.body = {
        addresses: [
          `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`,
          `bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr`
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockUtxos)
      }

      // Call the details API.
      const result = await utxosBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isArray(result[0])
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })
  })
})
