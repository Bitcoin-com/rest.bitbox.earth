/*
  TESTS FOR THE SLP.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  TODO:
  -See listSingleToken() tests.
*/
// imports
import * as chai from "chai"
//const proxyquire = require("proxyquire").noPreserveCache();
// Prepare the slpV2 for stubbing dependcies on slpjs.
import slpV2 from "./../../../src/routes/v2/slp"
import {
  mockBalance,
  mockConvert,
  mockList,
  mockSingleAddress,
  mockSingleToken,
  mockSingleTokenError,
  mockTokenDetails,
  mockTokenStats,
  mockTx
} from "./../mocks/slp-mocks"

// consts
const assert = chai.assert
const nock = require("nock") // HTTP mocking
const sinon = require("sinon")
//const pathStub = {}; // Used to stub methods within slpjs.
//const slpRouteStub = proxyquire("../../dist/routes/v2/slp", {
//  slpjs: pathStub
//});

let originalEnvVars: any // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes, mockNext } = require("./../mocks/express-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#SLP", () => {
  let mockServerUrl: any
  let req: any
  let res: any
  let next: any
  let sandbox: any

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITDB_URL: process.env.BITDB_URL,
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      SLPDB_URL: process.env.SLPDB_URL
    }

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"

    // Block network connections for unit tests.
    if (process.env.TEST === "unit") {
      process.env.BITDB_URL = "http://fakeurl/"
      process.env.BITCOINCOM_BASEURL = "http://fakeurl/"
      process.env.SLPDB_URL = "http://fakeurl/"
      mockServerUrl = `http://fakeurl`
    }
  })

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq
    res = mockRes

    // Explicitly reset the parmas and body.
    //req.params = {}
    req.body = {}
    req.query = {}
    req.locals = {}

    // Activate nock if it's inactive.
    if (!nock.isActive()) nock.activate()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    // Clean up HTTP mocks.
    nock.cleanAll() // clear interceptor list.
    nock.restore()

    sandbox.restore()
  })

  after(() => {
    // Restore any pre-existing environment variables.
    process.env.BITDB_URL = originalEnvVars.BITDB_URL
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.SLPDB_URL = originalEnvVars.SLPDB_URL
  })

  // describe("#root", async () => {
  //   // root route handler.
  //   const root = slpV2.testableComponents.root

  //   it("should respond to GET for base route", async () => {
  //     const result: any = root(req, res, next)
  //     //console.log(`result: ${util.inspect(result)}`)

  //     assert.equal(result.status, "slp", "Returns static string")
  //   })
  // })

  describe("list()", () => {
    // list route handler
    const list = slpV2.testableComponents.list

    it("should throw 500 when network issues", async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      const result: any = await list(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should GET list", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        const b64 = `eyJ2IjozLCJxIjp7ImRiIjpbInQiXSwiZmluZCI6eyIkcXVlcnkiOnt9fSwicHJvamVjdCI6eyJ0b2tlbkRldGFpbHMiOjEsInRva2VuU3RhdHMiOjEsIl9pZCI6MH0sImxpbWl0IjoxMDB9fQ==`

        nock(process.env.SLPDB_URL)
          .get((uri: any) => uri.includes("/"))
          .reply(200, mockList)
      }

      const result: any = await list(req, res, next)
      // console.log(`test result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "id",
        "timestamp",
        "symbol",
        "name",
        "documentUri",
        "documentHash",
        "decimals",
        "initialTokenQty"
      ])
    })
  })

  describe("listSingleToken()", () => {
    const listSingleToken = slpV2.testableComponents.listSingleToken

    it("should throw 400 if tokenId is empty", async () => {
      const result: any = await listSingleToken(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing BITDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result: any = await listSingleToken(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return 'not found' for mainnet txid on testnet", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get((uri: any) => uri.includes("/"))
          .reply(200, mockSingleToken)
      }

      req.params.tokenId =
        // testnet
        //"650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
        // mainnet
        "259908ae44f46ef585edef4bcc1e50dc06e4c391ac4be929fae27235b8158cf1"

      const result: any = await listSingleToken(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["id"])
      assert.include(result.id, "not found")
    })

    it("should get token information", async () => {
      // testnet
      const tokenIdToTest =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get((uri: any) => uri.includes("/"))
          .reply(200, mockSingleToken)
      }

      req.params.tokenId = tokenIdToTest

      const result: any = await listSingleToken(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "id",
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "mintingBatonStatus",
        "txnsSinceGenesis",
        "versionType",
        "timestamp",
        "timestampUnix",
        "symbol",
        "name",
        "documentUri",
        "documentHash",
        "decimals",
        "initialTokenQty",
        "totalBurned",
        "totalMinted",
        "validAddresses"
      ])
    })
  })

  describe("listBulkToken()", () => {
    const listBulkToken = slpV2.testableComponents.listBulkToken

    it("should throw 400 if tokenIds array is empty", async () => {
      const result: any = await listBulkToken(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenIds needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray: string[] = []
      for (let i: number = 0; i < 25; i++) testArray.push("")

      req.body.tokenIds = testArray

      const result: any = await listBulkToken(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    // TODO: Fix this test.
    // it("should throw 400 if tokenId is empty", async () => {
    //   // Mock the RPC call for unit tests.
    //   if (process.env.TEST === "unit") {
    //     nock(mockServerUrl)
    //       .get((uri: any) => uri.includes("/"))
    //       .reply(200, mockEmptyTokenId)
    //   }
    //   req.body.tokenIds = ""

    //   const result: any = await listBulkToken(req, res, next)
    //   // console.log(`result: ${util.inspect(result)}`)

    //   assert.hasAllKeys(result, ["error"])
    //   assert.include(
    //     result.error,
    //     "tokenIds needs to be an array. Use GET for single tokenId."
    //   )
    // })

    it("should throw 503 when network issues", async () => {
      // Save the existing BITDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.body.tokenIds = [
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
      ]

      const result: any = await listBulkToken(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should return 'not found' for mainnet txid on testnet", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get((uri: any) => uri.includes("/"))
          .reply(200, mockSingleTokenError)
      }

      req.body.tokenIds =
        // testnet
        //"650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
        // mainnet
        ["0b314bc2b2905b8844222871c6b665ae3494117c83b11302824561bb904efb6b"]

      const result: any = await listBulkToken(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["id", "valid"])
      assert.strictEqual(result[0].valid, false)
    })

    it("should get token information for single token ID", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get((uri: any) => uri.includes("/"))
          .reply(200, mockSingleToken)
      }

      req.body.tokenIds =
        // testnet
        ["650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"]

      const result: any = await listBulkToken(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "mintingBatonStatus",
        "txnsSinceGenesis",
        "versionType",
        "timestamp",
        "timestampUnix",
        "symbol",
        "name",
        "documentUri",
        "documentHash",
        "decimals",
        "initialTokenQty",
        "id",
        "totalBurned",
        "totalMinted",
        "validAddresses"
      ])
    })

    it("should get token information for multiple token IDs", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get((uri: any) => uri.includes("/"))
          .times(2)
          .reply(200, mockSingleToken)
      }

      req.body.tokenIds =
        // testnet
        [
          "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a",
          "c35a87afad11c8d086c1449ffd8b0a84324e72b15b1bcfdf166a493551b4eea6"
        ]

      const result: any = await listBulkToken(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "mintingBatonStatus",
        "txnsSinceGenesis",
        "versionType",
        "timestamp",
        "timestampUnix",
        "symbol",
        "name",
        "documentUri",
        "documentHash",
        "decimals",
        "initialTokenQty",
        "id",
        "totalBurned",
        "totalMinted",
        "validAddresses"
      ])
    })
  })

  describe("balancesForAddress()", () => {
    const balancesForAddress = slpV2.testableComponents.balancesForAddress

    it("should throw 400 if address is empty", async () => {
      const result: any = await balancesForAddress(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"

      const result: any = await balancesForAddress(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"

      const result: any = await balancesForAddress(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid")
    })

    it("should throw 5XX error when network issues", async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.params.address = "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5"

      const result: any = await balancesForAddress(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      assert.include(
        result.error,
        "Network error: Could not communicate",
        "Error message expected"
      )
    })

    it("should get token balance for an address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get((uri: any) => uri.includes("/"))
          .times(2)
          .reply(200, mockSingleAddress)
      }

      req.params.address = "slptest:pz0qcslrqn7hr44hsszwl4lw5r6udkg6zqv7sq3kk7"

      const result: any = await balancesForAddress(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "tokenId",
        "balance",
        "balanceString",
        "slpAddress",
        "decimalCount"
      ])
    })
  })

  describe("balancesForAddressByTokenID()", () => {
    const balancesForAddressByTokenID =
      slpV2.testableComponents.balancesForAddressByTokenID

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
      const result: any = await balancesForAddressByTokenID(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if tokenId is empty", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
      req.params.tokenId = ""
      const result: any = await balancesForAddressByTokenID(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result: any = await balancesForAddressByTokenID(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"

      const result: any = await balancesForAddressByTokenID(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid")
    })

    it("should throw 5XX error when network issues", async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.params.address = "slptest:qz4qnxcxwvmacgye8wlakhz0835x0w3vtvxu67w0ac"
      req.params.tokenId =
        "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796"

      const result: any = await balancesForAddressByTokenID(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      assert.include(
        result.error,
        "Network error: Could not communicate",
        "Error message expected"
      )
    })

    it("should get token information", async () => {
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get((uri: any) => uri.includes("/"))
          .times(2)
          .reply(200, mockSingleAddress)
      }

      req.params.address = "slptest:pz0qcslrqn7hr44hsszwl4lw5r6udkg6zqv7sq3kk7"
      req.params.tokenId =
        "6b081fcd1f78b187be1464313dac8ff257251b727a42b613552a4040870aeb29"

      const result: any = await balancesForAddressByTokenID(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      // TODO - add decimalCount
      // assert.hasAllKeys(result, ["tokenId", "balance", "decimalCount"])
      assert.hasAllKeys(result, ["tokenId", "balance", "balanceString"])
    })
  })

  describe("convertAddressSingle()", () => {
    const convertAddressSingle = slpV2.testableComponents.convertAddressSingle

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      const result: any = await convertAddressSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })
    //
    it("should convert address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .post(``)
          .reply(200, { result: mockConvert })
      }

      req.params.address = "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5"

      const result: any = await convertAddressSingle(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["cashAddress", "legacyAddress", "slpAddress"])
    })
  })

  describe("convertAddressBulk()", () => {
    const convertAddressBulk = slpV2.testableComponents.convertAddressBulk

    it("should throw 400 if addresses array is empty", async () => {
      const result: any = await convertAddressBulk(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "addresses needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result: any = await convertAddressBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should error on malformed address", async () => {
      try {
        req.body.addresses = ["bitcoincash:qzs02v05l7qs5s5dwuj0cx5ehjm2c"]

        await convertAddressBulk(req, res, next)

        assert.equal(true, false, "Unsupported address format")
      } catch (err) {
        // console.log(`err.message: ${util.inspect(err.message)}`)

        assert.include(err.message, `Unsupported address format`)
      }
    })

    it("should validate array with single element", async () => {
      req.body.addresses = [
        "bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"
      ]

      const result: any = await convertAddressBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "slpAddress",
        "cashAddress",
        "legacyAddress"
      ])
    })

    it("should validate array with multiple elements", async () => {
      req.body.addresses = [
        "bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c",
        "bitcoincash:qrehqueqhw629p6e57994436w730t4rzasnly00ht0"
      ]

      const result: any = await convertAddressBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "slpAddress",
        "cashAddress",
        "legacyAddress"
      ])
    })
  })

  describe("validateBulk()", () => {
    const validateBulk = slpV2.testableComponents.validateBulk

    it("should throw 400 if txid array is empty", async () => {
      const result: any = await validateBulk(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txids needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray: string[] = []
      for (let i: number = 0; i < 25; i++) testArray.push("")

      req.body.txids = testArray

      const result: any = await validateBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should validate array with single element", async () => {
      // Mock the RPC call for unit tests.
      // if (process.env.TEST === "unit") {
      //   // sandbox.stub(slpV2.testableComponents, "isValidSlpTxid").resolves(true)
      //   let foo = {
      //     txid:
      //       "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091",
      //     valid: true
      //   }
      //   console.log("FOO", foo)
      //   sandbox.stub(slpV2.testableComponents, "isValidSlpTxid").resolves([foo])
      // }

      req.body.txids = [
        "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091"
      ]

      const result: any = await validateBulk(req, res, next)
      console.log(result)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["txid", "valid"])
    })

    it("should validate array with two elements", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        sandbox.stub(slpV2.testableComponents, "isValidSlpTxid").resolves(true)
      }

      req.body.txids = [
        "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091",
        "82d996847a861b08b1601284ef7d40a1777d019154a6c4ed11571609dd3555ac"
      ]

      const result: any = await validateBulk(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["txid", "valid"])
      assert.equal(result.length, 2)
    })
  })

  describe("tokenStatsSingle()", () => {
    const tokenStatsSingle = slpV2.testableComponents.tokenStats

    it("should throw 400 if tokenID is empty", async () => {
      req.params.tokenId = ""
      const result: any = await tokenStatsSingle(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })
    //
    it("should get token stats for tokenId", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get((uri: any) => uri.includes("/"))
          .reply(200, {
            t: [
              {
                tokenDetails: mockTokenDetails,
                tokenStats: mockTokenStats
              }
            ]
          })
      }

      req.params.tokenId =
        "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"

      const result: any = await tokenStatsSingle(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "containsBaton",
        "initialTokenQty",
        "mintingBatonStatus",
        "circulatingSupply",
        "decimals",
        "documentHash",
        "versionType",
        "timestamp",
        "timestampUnix",
        "documentUri",
        "name",
        "symbol",
        "id",
        "totalBurned",
        "totalMinted",
        "txnsSinceGenesis",
        "validAddresses"
      ])
    })
  })

  describe("balancesForTokenSingle()", () => {
    const balancesForTokenSingle =
      slpV2.testableComponents.balancesForTokenSingle

    it("should throw 400 if tokenID is empty", async () => {
      req.params.tokenId = ""
      const result: any = await balancesForTokenSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })
    //
    it("should get balances for tokenId", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get((uri: any) => uri.includes("/"))
          .reply(200, {
            a: [mockBalance]
          })
      }

      req.params.tokenId =
        "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"

      const result: any = await balancesForTokenSingle(req, res, next)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result[0], [
        "tokenId",
        "slpAddress",
        "tokenBalance",
        "tokenBalanceString"
      ])
    })
  })

  describe("#txDetails()", () => {
    let txDetails = slpV2.testableComponents.txDetails

    it("should throw 400 if txid is empty", async () => {
      const result: any = await txDetails(req, res, next)
      //console.log(`result: ${util.inspect(txDetailsresult)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 400 for malformed txid", async () => {
      req.params.txid =
        "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457"

      const result: any = await txDetails(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "This is not a txid")
    })

    it("should throw 400 for non-existant txid", async () => {
      // Integration test
      if (process.env.TEST !== "unit") {
        req.params.txid =
          "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b94578223333"

        const result: any = await txDetails(req, res, next)
        //console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ["error"])
        assert.include(result.error, "TXID not found")
      }
    })

    it("should get tx details with token info", async () => {
      if (process.env.TEST === "unit") {
        // Mock the slpjs library for unit tests.
        sandbox
          .stub(slpV2.testableComponents, "getSlpjsTxDetails")
          .resolves(mockTx)
      }

      req.params.txid =
        "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457822d446"

      const result: any = await txDetails(req, res, next)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result, ["tokenIsValid", "tokenInfo"])
    })
  })

  describe("txsTokenIdAddressSingle()", () => {
    const txsTokenIdAddressSingle =
      slpV2.testableComponents.txsTokenIdAddressSingle

    it("should throw 400 if tokenId is empty", async () => {
      req.params.tokenId = ""
      const result: any = await txsTokenIdAddressSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 400 if address is empty", async () => {
      req.params.tokenId =
        "495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a"
      req.params.address = ""
      const result: any = await txsTokenIdAddressSingle(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })
    /*
    it("should get tx details with tokenId and address", async () => {
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get((uri: any) => uri.includes("/"))
          .reply(200, {
            c: mockTransactions
          })
      }

      //req.params.tokenId =
      //  "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"
      //req.params.address = "slptest:qr83cu3p7yg9yac7qthwm0nul2ev2kukvsqmes3vl0"

      req.params.tokenId =
        "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796"
      req.params.address = "slptest:qpwa35xq0q0cnmdu0rwzkct369hddzsqpsqdzw6h9h"


      const result: any = await txsTokenIdAddressSingle(req, res, next)
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result[0], ["txid", "tokenDetails"])
    })
*/
  })
})
