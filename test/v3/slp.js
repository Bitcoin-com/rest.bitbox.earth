/*
  TESTS FOR THE SLP.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  TODO:
  -See listSingleToken() tests.
*/

const chai = require("chai")
const assert = chai.assert
const nock = require("nock") // HTTP mocking
const sinon = require("sinon")
const axios = require("axios")

// Prepare the slpRoute for stubbing dependcies on slpjs.
const slpRoute = require("../../dist/routes/v2/slp")

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/slp-mocks")
const slpjsMock = require("./mocks/slpjs-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#SLP", () => {
  let req, res, mockServerUrl
  let sandbox

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

  describe("#root", async () => {
    // root route handler.
    const root = slpRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "slp", "Returns static string")
    })
  })

  describe("#lookupToken", () => {
    const lookupToken = slpRoute.testableComponents.lookupToken

    it("should return 'not found' for invalid token ID.", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(process.env.SLPDB_URL)
          .get(uri => uri.includes("/"))
          .reply(200, {
            t: []
          })
      }

      const tokenId =
        "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb"

      const result = await lookupToken(tokenId)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, "id")
      assert.equal(result.id, "not found")
    })
  })

  describe("list()", () => {
    // list route handler
    const list = slpRoute.testableComponents.list

    it("should throw 500 when network issues", async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      const result = await list(req, res)
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
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockList)
      }

      const result = await list(req, res)
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

  describe("#listSingleToken()", () => {
    const listSingleToken = slpRoute.testableComponents.listSingleToken

    it("should throw 400 if tokenId is empty", async () => {
      const result = await listSingleToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

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

      const result = await listSingleToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      // Dev note: Some systems respond with a 500 or a 503. What matters is the
      // response is 500 or above.
      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
    })

    it("should return 'not found' for mainnet txid on testnet", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        sandbox.stub(axios, "get").resolves({
          result: {
            id: "not found"
          },
          data: {
            t: []
          }
        })
      }

      req.params.tokenId =
        // testnet
        //"650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
        // mainnet
        "259908ae44f46ef585edef4bcc1e50dc06e4c391ac4be929fae27235b8158cf1"

      const result = await listSingleToken(req, res)
      console.log(`result: ${util.inspect(result)}`)

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
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleToken)
      }

      req.params.tokenId = tokenIdToTest

      const result = await listSingleToken(req, res)
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
    const listBulkToken = slpRoute.testableComponents.listBulkToken

    it("should throw 400 if tokenIds array is empty", async () => {
      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenIds needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.tokenIds = testArray

      const result = await listBulkToken(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw 400 if tokenId is empty", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockEmptyTokenId)
      }
      req.body.tokenIds = ""

      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(
        result.error,
        "tokenIds needs to be an array. Use GET for single tokenId."
      )
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing BITDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.body.tokenIds = [
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
      ]

      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      // Dev note: Some systems respond with a 500 or a 503. What matters is the
      // response is 500 or above.
      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
    })

    it("should return 'not found' for mainnet txid on testnet", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleTokenError)
      }

      req.body.tokenIds =
        // testnet
        //"650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
        // mainnet
        ["0b314bc2b2905b8844222871c6b665ae3494117c83b11302824561bb904efb6b"]

      const result = await listBulkToken(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["id", "valid"])
      assert.strictEqual(result[0].valid, false)
    })

    it("should get token information for single token ID", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleToken)
      }

      req.body.tokenIds =
        // testnet
        ["650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"]

      const result = await listBulkToken(req, res)
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
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockSingleToken)
      }

      req.body.tokenIds =
        // testnet
        [
          "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a",
          "c35a87afad11c8d086c1449ffd8b0a84324e72b15b1bcfdf166a493551b4eea6"
        ]

      const result = await listBulkToken(req, res)
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

  describe("balancesForAddressSingle()", () => {
    const balancesForAddressSingle =
      slpRoute.testableComponents.balancesForAddressSingle

    it("should throw 400 if address is empty", async () => {
      const result = await balancesForAddressSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"

      const result = await balancesForAddressSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"

      const result = await balancesForAddressSingle(req, res)
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

      const result = await balancesForAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      // Dev note: Some systems respond with a 500 or a 503. What matters is the
      // response is 500 or above.
      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
    })

    it("should get token balance for an address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockSingleAddress)
      }

      req.params.address = "slptest:qr7uq765zrmsv2vqtyvh00620ckje2v5ncuculxlmh"

      const result = await balancesForAddressSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

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

  describe("#balancesForAddressBulk", () => {
    const balancesForAddressBulk =
      slpRoute.testableComponents.balancesForAddressBulk

    it("should throw 400 if address is empty", async () => {
      const result = await balancesForAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "addresses needs to be an array")
    })

    // TO-DO: This test case fails and needs to be fixed.
    // it("should throw 400 if address is invalid", async () => {
    //   req.body.addresses = ["badAddress"]
    //
    //   const result = await balancesForAddressBulk(req, res)
    //   console.log(`result: ${util.inspect(result)}`)
    //
    //   assert.hasAllKeys(result, ["error"])
    //   assert.include(result.error, "Invalid BCH address.")
    // })

    // TO-DO: This test case fails and needs to be fixed.
    // it("should throw 400 if address network mismatch", async () => {
    //   req.body.addresses = [
    //     "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
    //   ]
    //
    //   const result = await balancesForAddressBulk(req, res)
    //   console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //
    //   assert.hasAllKeys(result, ["error"])
    //   assert.include(result.error, "Invalid")
    // })

    it("should throw 5XX error when network issues", async () => {
      // Save the existing SLPDB_URL.
      const savedUrl2 = process.env.SLPDB_URL

      // Manipulate the URL to cause a 500 network error.
      process.env.SLPDB_URL = "http://fakeurl/api/"

      req.body.addresses = [
        "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5"
      ]

      const result = await balancesForAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      // Dev note: Some systems respond with a 500 or a 503. What matters is the
      // response is 500 or above.
      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
    })

    it("should get token balance for an address", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockSingleAddress)
      }

      req.body.addresses = [
        "slptest:qr7uq765zrmsv2vqtyvh00620ckje2v5ncuculxlmh"
      ]

      const result = await balancesForAddressBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0][0], [
        "tokenId",
        "balance",
        "balanceString",
        "slpAddress",
        "decimalCount"
      ])
    })
  })

  describe("balancesForAddressByTokenIDSingle()", () => {
    const balancesForAddressByTokenIDSingle =
      slpRoute.testableComponents.balancesForAddressByTokenIDSingle

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"
      const result = await balancesForAddressByTokenIDSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })

    it("should throw 400 if tokenId is empty", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"
      req.params.tokenId = ""
      const result = await balancesForAddressByTokenIDSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 400 if address is invalid", async () => {
      req.params.address = "badAddress"
      req.params.tokenId =
        "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a"

      const result = await balancesForAddressByTokenIDSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Invalid BCH address.")
    })

    it("should throw 400 if address network mismatch", async () => {
      req.params.address =
        "simpleledger:qr5agtachyxvrwxu76vzszan5pnvuzy8duhv4lxrsk"

      const result = await balancesForAddressByTokenIDSingle(req, res)
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

      const result = await balancesForAddressByTokenIDSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.SLPDB_URL = savedUrl2

      // Dev note: Some systems respond with a 500 or a 503. What matters is the
      // response is 500 or above.
      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
    })

    it("should get token information", async () => {
      if (process.env.TEST === "unit") {
        nock(mockServerUrl)
          .get(uri => uri.includes("/"))
          .times(2)
          .reply(200, mockData.mockSingleAddress)
      }

      req.params.address = "slptest:pz0qcslrqn7hr44hsszwl4lw5r6udkg6zqv7sq3kk7"
      req.params.tokenId =
        "6b081fcd1f78b187be1464313dac8ff257251b727a42b613552a4040870aeb29"

      const result = await balancesForAddressByTokenIDSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      // TODO - add decimalCount
      // assert.hasAllKeys(result, ["tokenId", "balance", "decimalCount"])
      assert.hasAllKeys(result, [
        "cashAddress",
        "legacyAddress",
        "slpAddress",
        "tokenId",
        "balance",
        "balanceString"
      ])
    })
  })

  describe("convertAddressSingle()", () => {
    const convertAddressSingle =
      slpRoute.testableComponents.convertAddressSingle

    it("should throw 400 if address is empty", async () => {
      req.params.address = ""
      const result = await convertAddressSingle(req, res)
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
          .reply(200, { result: mockData.mockConvert })
      }

      req.params.address = "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5"

      const result = await convertAddressSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["cashAddress", "legacyAddress", "slpAddress"])
    })
  })

  describe("convertAddressBulk()", () => {
    const convertAddressBulk = slpRoute.testableComponents.convertAddressBulk

    it("should throw 400 if addresses array is empty", async () => {
      const result = await convertAddressBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "addresses needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.addresses = testArray

      const result = await convertAddressBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should error on malformed address", async () => {
      try {
        req.body.addresses = ["bitcoincash:qzs02v05l7qs5s5dwuj0cx5ehjm2c"]

        await convertAddressBulk(req, res)

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

      const result = await convertAddressBulk(req, res)
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

      const result = await convertAddressBulk(req, res)
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
    const validateBulk = slpRoute.testableComponents.validateBulk

    it("should throw 400 if txid array is empty", async () => {
      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txids needs to be an array")
      assert.equal(res.statusCode, 400)
    })

    it("should throw 400 error if array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.txids = testArray

      const result = await validateBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should validate array with single element", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockSingleValidTxid)
      }

      req.body.txids = [
        "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091"
      ]

      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["txid", "valid"])
    })

    it("should validate array with two elements", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockTwoValidTxid)
      }

      req.body.txids = [
        "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091",
        "82d996847a861b08b1601284ef7d40a1777d019154a6c4ed11571609dd3555ac"
      ]

      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["txid", "valid"])
      assert.equal(result.length, 2)
    })

    // Captures a regression bug that went out to production, captured in this
    // GitHub Issue: https://github.com/Bitcoin-com/rest.bitcoin.com/issues/518
    it("should return two elements if given two elements", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockTwoRedundentTxid)
      }

      req.body.txids = [
        "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091",
        "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091"
      ]

      const result = await validateBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["txid", "valid"])
      assert.equal(result.length, 2)
    })
  })

  describe("tokenStatsSingle()", () => {
    const tokenStatsSingle = slpRoute.testableComponents.tokenStatsSingle

    it("should throw 400 if tokenID is empty", async () => {
      req.params.tokenId = ""
      const result = await tokenStatsSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })
    //
    it("should get token stats for tokenId", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, {
            t: [
              {
                tokenDetails: mockData.mockTokenDetails,
                tokenStats: mockData.mockTokenStats
              }
            ]
          })
      }

      req.params.tokenId =
        "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"

      const result = await tokenStatsSingle(req, res)
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
      slpRoute.testableComponents.balancesForTokenSingle

    it("should throw 400 if tokenID is empty", async () => {
      req.params.tokenId = ""
      const result = await balancesForTokenSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })
    //
    it("should get balances for tokenId", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, {
            a: [mockData.mockBalance]
          })
      }

      req.params.tokenId =
        "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"

      const result = await balancesForTokenSingle(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result[0], [
        "tokenId",
        "slpAddress",
        "tokenBalance",
        "tokenBalanceString"
      ])
    })
  })

  describe("#balancesForTokenBulk", () => {
    const balancesForTokenBulk =
      slpRoute.testableComponents.balancesForTokenBulk

    // TO-DO: This test fails and needs to be fixed.
    // it("should throw 400 if tokenID is empty", async () => {
    //   req.body.tokenIds = [""]
    //   const result = await balancesForTokenBulk(req, res)
    //   console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //
    //   assert.hasAllKeys(result, ["error"])
    //   assert.include(result.error, "tokenId can not be empty")
    // })

    it("should get balances for tokenId", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, {
            a: [mockData.mockBalance]
          })
      }

      req.body.tokenIds = [
        "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"
      ]

      const result = await balancesForTokenBulk(req, res)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAllKeys(result[0][0], [
        "tokenId",
        "slpAddress",
        "tokenBalance",
        "tokenBalanceString"
      ])
    })
  })

  describe("#txDetails()", () => {
    const txDetails = slpRoute.testableComponents.txDetails

    it("should throw 400 if txid is empty", async () => {
      const result = await txDetails(req, res)
      //console.log(`result: ${util.inspect(txDetailsresult)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 400 for malformed txid", async () => {
      req.params.txid =
        "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457"

      const result = await txDetails(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "This is not a txid")
    })

    // CT 6/21/19 - Commenting out this test for now until testnet insight API comes
    // back up. It's been down now for several days.
    /*
    it("should throw 400 for non-existant txid", async () => {
      // Integration test
      if (process.env.TEST !== "unit") {
        req.params.txid =
          "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b94578223333"

        const result = await txDetails(req, res)
        //console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ["error"])
        assert.include(result.error, "TXID not found")
      }
    })
*/

    if (process.env.TEST === "integration") {
      it("should get tx details with token info", async () => {
        // TODO: add mocking for unit testing. How do I mock reponse form SLPDB
        // since it's not an object?

        // if (process.env.TEST === "unit") {
        //   // Mock the slpjs library for unit tests.
        //   sandbox
        //     .stub(slpRoute.testableComponents, "getSlpjsTxDetails")
        //     .resolves(mockData.mockTx)
        // }

        req.params.txid =
          "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457822d446"

        const result = await txDetails(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.hasAnyKeys(result, ["tokenIsValid", "tokenInfo"])
      })

      it("should throw an error for a non-existent txid", async () => {
        req.params.txid =
          "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457822d555"

        const result = await txDetails(req, res)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(result.error, "SLP transaction not found")
      })
    }
  })

  describe("txsTokenIdAddressSingle()", () => {
    const txsTokenIdAddressSingle =
      slpRoute.testableComponents.txsTokenIdAddressSingle

    it("should throw 400 if tokenId is empty", async () => {
      req.params.tokenId = ""
      const result = await txsTokenIdAddressSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "tokenId can not be empty")
    })

    it("should throw 400 if address is empty", async () => {
      req.params.tokenId =
        "495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a"
      req.params.address = ""
      const result = await txsTokenIdAddressSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "address can not be empty")
    })
    /*
    it("should get tx details with tokenId and address", async () => {
      if (process.env.TEST === "unit") {
        nock(`${process.env.SLPDB_URL}`)
          .get(uri => uri.includes("/"))
          .reply(200, {
            c: mockData.mockTransactions
          })
      }

      //req.params.tokenId =
      //  "37279c7dc81ceb34d12f03344b601c582e931e05d0e552c29c428bfa39d39af3"
      //req.params.address = "slptest:qr83cu3p7yg9yac7qthwm0nul2ev2kukvsqmes3vl0"

      req.params.tokenId =
        "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796"
      req.params.address = "slptest:qpwa35xq0q0cnmdu0rwzkct369hddzsqpsqdzw6h9h"


      const result = await txsTokenIdAddressSingle(req, res)
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result[0], ["txid", "tokenDetails"])
    })
*/
  })
})
