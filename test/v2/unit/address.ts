/*
  TESTS FOR THE ADDRESS.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  To-Do:
  -/details/:address
  --Verify to/from query options work correctly.
  -GET /unconfirmed/:address & POST /unconfirmed
  --Should initiate a transfer of BCH to verify unconfirmed TX.
  ---This would be more of an e2e test.
*/

// imports
import * as chai from "chai"
import addressV2 from "./../../../src/routes/v2/address"
// Mocking data.
import {
  mockAddressDetails,
  mockTransactions,
  mockUtxoDetails
} from "./../mocks/address-mocks"

// consts
const assert = chai.assert
const nock = require("nock") // HTTP mocking
let originalUrl: any // Used during transition from integration to unit tests.

const { mockReq, mockRes } = require("./../mocks/express-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#AddressRouter", () => {
  let req: any
  let res: any
  let next: any

  before(() => {
    originalUrl = process.env.BITCOINCOM_BASEURL

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
    if (process.env.TEST === "unit")
      process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

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
    process.env.BITCOINCOM_BASEURL = originalUrl
  })

  // describe("#root", () => {
  //   // root route handler.
  //   const root = addressV2.testableComponents.root

  //   it("should respond to GET for base route", async () => {
  //     const result: express.Response = root(req, res, next)

  //     assert.equal(result.status, "address", "Returns static string")
  //   })
  // })

  describe("#AddressDetailsBulk", () => {
    // details route handler.
    const detailsBulk = addressV2.testableComponents.detailsBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await detailsBulk(req, res, next)
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

      const result: any = await detailsBulk(req, res, next)

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

      const result: any = await detailsBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray: string[] = []
      for (let i: number = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result: any = await detailsBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
      }

      const result: any = await detailsBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body = {
          addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result: any = await detailsBulk(req, res, next)
        //console.log(`network issue result: ${util.inspect(result)}`)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.isAbove(res.statusCode, 499, "HTTP status code 500 expected.")
        //assert.include(result.error, "ENOTFOUND", "Error message expected")
        assert.include(
          result.error,
          "Network error: Could not communicate",
          "Error message expected"
        )
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should default to page 0", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsBulk(req, res, next)
      console.log(`result: ${util.inspect(result)}`)

      // Assert current page defaults to 0
      assert.equal(result[0].currentPage, 0)
    })

    it("should process the requested page", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`],
        page: 5
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=5000&to=6000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert current page is same as requested
      assert.equal(result[0].currentPage, 5)
    })

    it("should calculate the total number of pages", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result[0].pagesTotal, 1)
    })

    it("should get details for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsBulk(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.equal(result.length, 1, "Array with one entry")
      assert.hasAllKeys(result[0], [
        "balance",
        "balanceSat",
        "totalReceived",
        "totalReceivedSat",
        "totalSent",
        "totalSentSat",
        "unconfirmedBalance",
        "unconfirmedBalanceSat",
        "unconfirmedTxApperances",
        "txApperances",
        "transactions",
        "legacyAddress",
        "cashAddress",
        "slpAddress",
        "currentPage",
        "pagesTotal"
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
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockAddressDetails)

        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mwJnEzXzKkveF2q5Af9jxi9j1zrtWAnPU8?from=0&to=1000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsBulk(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })
  })

  describe("#AddressDetailsSingle", () => {
    // details route handler.
    const detailsSingle = addressV2.testableComponents.detailsSingle

    it("should throw 400 if address is empty", async () => {
      const result: any = await detailsSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should error on an array", async () => {
      req.params.address = [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]

      const result: any = await detailsSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.params.address = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      const result: any = await detailsSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.params.address = `bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`

      const result: any = await detailsSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.params.address = `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result: any = await detailsSingle(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should default to page 0", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert current page defaults to 0
      assert.equal(result.currentPage, 0)
    })

    it("should process the requested page", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`
      req.query.page = 5

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=5000&to=6000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsSingle(req, res, next)

      // Assert current page is same as requested
      assert.equal(result.currentPage, 5)
    })

    it("should calculate the total number of pages", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsSingle(req, res, next)

      assert.equal(result.pagesTotal, 1)
    })

    it("should get details for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz?from=0&to=1000`)
          .reply(200, mockAddressDetails)
      }

      // Call the details API.
      const result: any = await detailsSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.hasAllKeys(result, [
        "balance",
        "balanceSat",
        "totalReceived",
        "totalReceivedSat",
        "totalSent",
        "totalSentSat",
        "unconfirmedBalance",
        "unconfirmedBalanceSat",
        "unconfirmedTxApperances",
        "txApperances",
        "transactions",
        "legacyAddress",
        "cashAddress",
        "slpAddress",
        "currentPage",
        "pagesTotal"
      ])
    })
  })

  describe("#AddressUtxoBulk", () => {
    // utxo route handler.
    const utxoBulk = addressV2.testableComponents.utxoBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await utxoBulk(req, res, next)

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

      const result: any = await utxoBulk(req, res, next)

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

      const result: any = await utxoBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
      }

      const result: any = await utxoBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body = {
          addresses: [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api"

        const result: any = await utxoBulk(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should get utxos for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz/utxo`)
          .reply(200, mockUtxoDetails)
      }

      // Call the details API.
      const result: any = await utxoBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result, "result should be an array")

      // Each element should have these primary properties.
      assert.hasAllKeys(result[0], [
        "utxos",
        "legacyAddress",
        "cashAddress",
        "slpAddress",
        "scriptPubKey"
      ])

      // Validate the UTXO data structure.
      assert.hasAnyKeys(result[0].utxos[0], [
        "txid",
        "vout",
        "amount",
        "satoshis",
        "height",
        "confirmations"
      ])
    })

    it("should get utxos for mulitple addresses", async () => {
      req.body = {
        addresses: [
          `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`,
          `bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr`
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz/utxo`)
          .reply(200, mockUtxoDetails)

        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mwJnEzXzKkveF2q5Af9jxi9j1zrtWAnPU8/utxo`)
          .reply(200, mockUtxoDetails)
      }

      // Call the details API.
      const result: any = await utxoBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result: any = await utxoBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })
  })

  describe("#AddressUtxoSingle", () => {
    // details route handler.
    const utxoSingle = addressV2.testableComponents.utxoSingle

    it("should throw 400 if address is empty", async () => {
      const result: any = await utxoSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should error on an array", async () => {
      req.params.address = [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]

      const result: any = await utxoSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.params.address = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      const result: any = await utxoSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.params.address = `bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`

      const result: any = await utxoSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result: any = await utxoSingle(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should get details for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz/utxo`)
          .reply(200, mockUtxoDetails)
      }

      // Call the details API.
      const result: any = await utxoSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      // Each element should have these primary properties.
      assert.hasAllKeys(result, [
        "utxos",
        "legacyAddress",
        "cashAddress",
        "slpAddress",
        "scriptPubKey"
      ])

      // Validate the UTXO data structure.
      assert.hasAnyKeys(result.utxos[0], [
        "txid",
        "vout",
        "amount",
        "satoshis",
        "height",
        "confirmations"
      ])
    })
  })

  describe("#AddressUnconfirmedBulk", () => {
    // unconfirmed route handler.
    const unconfirmedBulk = addressV2.testableComponents.unconfirmedBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await unconfirmedBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single address", async () => {
      req.body = {
        address: `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`
      }

      const result: any = await unconfirmedBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result: any = await unconfirmedBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw an error for an invalid address", async () => {
      req.body = {
        addresses: [`02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
      }

      const result: any = await unconfirmedBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
      }

      const result: any = await unconfirmedBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body = {
          addresses: [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api"

        const result: any = await unconfirmedBulk(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should get unconfirmed data for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz/utxo`)
          .reply(200, mockUtxoDetails)
      }

      // Call the details API.
      const result: any = await unconfirmedBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)
      //console.log(`result[0].utxos: ${util.inspect(result[0].utxos)}`)

      assert.isArray(result, "result should be an array")

      // Dev note: Unconfirmed TXs are hard to test in an integration test because
      // the nature of an unconfirmed transation is transient. It quickly becomes
      // confirmed and thus should not show up.
    })

    it("should get unconfirmed data for an array of addresses", async () => {
      req.body = {
        addresses: [
          `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`,
          `bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr`
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz/utxo`)
          .reply(200, mockUtxoDetails)

        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mwJnEzXzKkveF2q5Af9jxi9j1zrtWAnPU8/utxo`)
          .reply(200, mockUtxoDetails)
      }

      // Call the details API.
      const result: any = await unconfirmedBulk(req, res, next)

      assert.isArray(result)
    })
  })

  describe("#AddressUnconfirmedSingle", () => {
    // details route handler.
    const unconfirmedSingle = addressV2.testableComponents.unconfirmedSingle

    it("should throw 400 if address is empty", async () => {
      const result: any = await unconfirmedSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should error on an array", async () => {
      req.params.address = [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]

      const result: any = await unconfirmedSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.params.address = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      const result: any = await unconfirmedSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.params.address = `bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`

      const result: any = await unconfirmedSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.params.address = `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result: any = await unconfirmedSingle(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should get details for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/mgps7qxk2Z5ma4mXsviznnet8wx4VvMPFz/utxo`)
          .reply(200, mockUtxoDetails)
      }

      // Call the details API.
      const result: any = await unconfirmedSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      // Each element should have these primary properties.
      assert.hasAllKeys(result, [
        "utxos",
        "legacyAddress",
        "cashAddress",
        "slpAddress",
        "scriptPubKey"
      ])

      assert.isArray(result.utxos)
    })
  })

  describe("#AddressTransactionsBulk", () => {
    // unconfirmed route handler.
    const transactionsBulk = addressV2.testableComponents.transactionsBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await transactionsBulk(req, res, next)

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

      const result: any = await transactionsBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "addresses needs to be an array",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result: any = await transactionsBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw an error for an invalid address", async () => {
      req.body = {
        addresses: [`02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
      }

      const result: any = await transactionsBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.body = {
        addresses: [`bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`]
      }

      const result: any = await transactionsBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body = {
          addresses: [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]
        }

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api"

        const result: any = await transactionsBulk(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should default to page 0", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=0`
          )
          .reply(200, mockTransactions)
      }

      // Call the endpoint
      const result: any = await transactionsBulk(req, res, next)

      // Assert current page defaults to 0
      assert.equal(result[0].currentPage, 0)
    })

    it("should process the requested page", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`],
        page: 5
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=5`
          )
          .reply(200, mockTransactions)
      }

      // Call the endpoint
      const result: any = await transactionsBulk(req, res, next)

      // Assert current page is same as requested
      assert.equal(result[0].currentPage, 5)
    })

    it("should get transactions for a single address", async () => {
      req.body = {
        addresses: [`bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=0`
          )
          .reply(200, mockTransactions)
      }

      // Call the details API.
      const result: any = await transactionsBulk(req, res, next)

      assert.isArray(result, "result should be an array")

      assert.exists(result[0].pagesTotal)
      assert.exists(result[0].currentPage)
      assert.exists(result[0].txs)
      assert.isArray(result[0].txs)
      assert.exists(result[0].legacyAddress)
      assert.exists(result[0].cashAddress)
    })

    it("should get transactions for an array of addresses", async () => {
      req.body = {
        addresses: [
          `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`,
          `bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr`
        ]
      }

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=0`
          )
          .reply(200, mockTransactions)

        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qzknfggae0av6yvxk77gmyq7syc67yux6sk80haqyr&pageNum=0`
          )
          .reply(200, mockTransactions)
      }

      // Call the details API.
      const result: any = await transactionsBulk(req, res, next)

      assert.isArray(result, "result should be an array")

      assert.equal(result.length, 2, "Array should have 2 elements")
    })
  })

  describe("#AddressTransactionsSingle", () => {
    // details route handler.
    const transactionsSingle = addressV2.testableComponents.transactionsSingle

    it("should throw 400 if address is empty", async () => {
      const result: any = await transactionsSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should error on an array", async () => {
      req.params.address = [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`]

      const result: any = await transactionsSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "address can not be an array",
        "Proper error message"
      )
    })

    it("should throw an error for an invalid address", async () => {
      req.params.address = `02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

      const result: any = await transactionsSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Invalid BCH address",
        "Proper error message"
      )
    })

    it("should detect a network mismatch", async () => {
      req.params.address = `bitcoincash:qqqvv56zepke5k0xeaehlmjtmkv9ly2uzgkxpajdx3`

      const result: any = await transactionsSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "Invalid network", "Proper error message")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.params.address = `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result: any = await transactionsSingle(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should default to page 0", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=0`
          )
          .reply(200, mockTransactions)
      }

      // Call the endpoint
      const result: any = await transactionsSingle(req, res, next)

      // Assert current page defaults to 0
      assert.equal(result.currentPage, 0)
    })

    it("should process the requested page", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`
      req.query.page = 5

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=5`
          )
          .reply(200, mockTransactions)
      }

      // Call the endpoint
      const result: any = await transactionsSingle(req, res, next)

      // Assert current page is same as requested
      assert.equal(result.currentPage, 5)
    })

    it("should get details for a single address", async () => {
      req.params.address = `bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4`

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(
            `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=0`
          )
          .reply(200, mockTransactions)
      }

      // Call the details API.
      const result: any = await transactionsSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.exists(result.pagesTotal)
      assert.exists(result.currentPage)
      assert.exists(result.txs)
      assert.isArray(result.txs)
      assert.exists(result.legacyAddress)
      assert.exists(result.cashAddress)
    })
  })

  describe("#AddressFromXPubSingle", () => {
    // details route handler.
    const fromXPubSingle = addressV2.testableComponents.fromXPubSingle

    it("should throw 400 if xpub is empty", async () => {
      const result: any = await fromXPubSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "xpub can not be empty")
    })

    it("should error on an array", async () => {
      req.params.xpub = [
        `tpubDHTK2jqg73w3GwoiHfAMbMYML1HN8FhrUxD9rFgbSgHXdwwrY6pAFqKDfUHhqw7vreaZty5hPGjb1S7ZPQeMmu6TFHAKfY9tJpYbvaGjPRM`
      ]

      const result: any = await fromXPubSingle(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "xpub can not be an array",
        "Proper error message"
      )
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.params.xpub = `tpubDHTK2jqg73w3GwoiHfAMbMYML1HN8FhrUxD9rFgbSgHXdwwrY6pAFqKDfUHhqw7vreaZty5hPGjb1S7ZPQeMmu6TFHAKfY9tJpYbvaGjPRM`

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result: any = await fromXPubSingle(req, res, next)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should create an address from xpub", async () => {
      req.params.xpub = `tpubDHTK2jqg73w3GwoiHfAMbMYML1HN8FhrUxD9rFgbSgHXdwwrY6pAFqKDfUHhqw7vreaZty5hPGjb1S7ZPQeMmu6TFHAKfY9tJpYbvaGjPRM`

      // Mock the Insight URL for unit tests.
      // TODO add unit test
      // if (process.env.TEST === "unit") {
      //   nock(`${process.env.BITCOINCOM_BASEURL}`)
      //     .get(
      //       `/txs/?address=bchtest:qq89kjkeqz9mngp8kl3dpmu43y2wztdjqu500gn4c4&pageNum=0`
      //     )
      //     .reply(200, mockTransactions)
      // }

      // Call the details API.
      const result: any = await fromXPubSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.exists(result.legacyAddress)
      assert.exists(result.cashAddress)
    })
  })
})
