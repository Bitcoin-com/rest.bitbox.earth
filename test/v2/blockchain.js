/*
  TODO:
  -getRawMempool
  --Add tests for 'verbose' input values
  -getMempoolEntry & getMempoolEntryBulk
  --Needs e2e test to create unconfirmed tx, for real-world test.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const nock = require("nock") // HTTP mocking
const blockchainRoute = require("../../dist/routes/v2/blockchain")

const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

if (!process.env.TEST) process.env.TEST = "unit"

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks")
const mockData = require("./mocks/blockchain-mock")

let originalEnvVars // Used during transition from integration to unit tests.

describe("#BlockchainRouter", () => {
  let req, res

  // local node will be started in regtest mode on the port 48332
  //before(panda.runLocalNode)

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }

    // Set default environment variables for unit tests.
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

    // Activate nock if it's inactive.
    if (!nock.isActive()) nock.activate()
  })

  afterEach(() => {
    // Clean up HTTP mocks.
    nock.cleanAll() // clear interceptor list.
    nock.restore()
  })

  after(() => {
    // otherwise the panda will run forever
    //process.exit()

    // Restore any pre-existing environment variables.
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.RPC_BASEURL = originalEnvVars.RPC_BASEURL
    process.env.RPC_USERNAME = originalEnvVars.RPC_USERNAME
    process.env.RPC_PASSWORD = originalEnvVars.RPC_PASSWORD
  })

  describe("#root", () => {
    // root route handler.
    const root = blockchainRoute.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)

      assert.equal(result.status, "blockchain", "Returns static string")
    })
  })

  describe("getBestBlockHash()", () => {
    // block route handler.
    const getBestBlockHash = blockchainRoute.testableComponents.getBestBlockHash

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getBestBlockHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getBestBlockHash", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockHash })
      }

      const result = await getBestBlockHash(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result.length, 64, "Hash string is fixed length")
    })
  })

  describe("getBlockchainInfo()", () => {
    // block route handler.
    const getBlockchainInfo =
      blockchainRoute.testableComponents.getBlockchainInfo

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getBlockchainInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getBlockchainInfo", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockchainInfo })
      }

      const result = await getBlockchainInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "chain",
        "blocks",
        "headers",
        "bestblockhash",
        "difficulty",
        "mediantime",
        "verificationprogress",
        "chainwork",
        "pruned",
        "softforks",
        "bip9_softforks"
      ])
    })
  })

  describe("getBlockCount()", () => {
    // block route handler.
    const getBlockCount = blockchainRoute.testableComponents.getBlockCount

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getBlockCount(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getBlockCount", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: 126769 })
      }

      const result = await getBlockCount(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })

  describe("getBlockHeaderSingle()", async () => {
    const getBlockHeader =
      blockchainRoute.testableComponents.getBlockHeaderSingle

    it("should throw 400 error if hash is missing", async () => {
      const result = await getBlockHeader(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hash can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.hash =
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"

      const result = await getBlockHeader(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Network error: Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET block header", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "0000ff7f7d217c9b7845ea8b50d620c59a1bf7c276566406e9b7bc7e463e0000000000006d70322c0b697c1c81d2744f87f09f1e9780ba5d30338952e2cdc64e60456f8423bb0a5ceafa091a3e843526"
          })
      }

      req.params.hash =
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"

      const result = await getBlockHeader(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(
        result,
        "0000ff7f7d217c9b7845ea8b50d620c59a1bf7c276566406e9b7bc7e463e0000000000006d70322c0b697c1c81d2744f87f09f1e9780ba5d30338952e2cdc64e60456f8423bb0a5ceafa091a3e843526"
      )
    })

    it("should GET verbose block header", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockHeader })
      }

      req.query.verbose = true
      req.params.hash =
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"

      const result = await getBlockHeader(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, [
        "hash",
        "confirmations",
        "height",
        "version",
        "versionHex",
        "merkleroot",
        "time",
        "mediantime",
        "nonce",
        "bits",
        "difficulty",
        "chainwork",
        "previousblockhash",
        "nextblockhash"
      ])
    })
  })

  describe("#getBlockHeaderBulk", () => {
    // route handler.
    const getBlockHeaderBulk =
      blockchainRoute.testableComponents.getBlockHeaderBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await getBlockHeaderBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "hashes needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single hash", async () => {
      req.body.hashes =
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"

      const result = await getBlockHeaderBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "hashes needs to be an array",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.hashes = testArray

      const result = await getBlockHeaderBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw a 400 error for an invalid hash", async () => {
      req.body.hashes = ["badHash"]

      await getBlockHeaderBulk(req, res)
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
    })

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL

      try {
        req.body.hashes = [
          "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"
        ]

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"

        const result = await getBlockHeaderBulk(req, res)

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.")
        assert.include(result.error, "ENOTFOUND", "Error message expected")
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl
      }
    })

    it("should get concise block header for a single hash", async () => {
      req.body.hashes = [
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"
      ]

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockHeaderConcise })
      }

      // Call the details API.
      const result = await getBlockHeaderBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.isArray(result)
      assert.equal(
        result[0],
        "0000ff7f7d217c9b7845ea8b50d620c59a1bf7c276566406e9b7bc7e463e0000000000006d70322c0b697c1c81d2744f87f09f1e9780ba5d30338952e2cdc64e60456f8423bb0a5ceafa091a3e843526"
      )
    })

    it("should get verbose block header for a single hash", async () => {
      req.body = {
        hashes: [
          "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"
        ],
        verbose: true
      }

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockBlockHeader })
      }

      // Call the details API.
      const result = await getBlockHeaderBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Assert that required fields exist in the returned object.
      assert.isArray(result)
      assert.hasAllKeys(result[0], [
        "hash",
        "confirmations",
        "height",
        "version",
        "versionHex",
        "merkleroot",
        "time",
        "mediantime",
        "nonce",
        "bits",
        "difficulty",
        "chainwork",
        "previousblockhash",
        "nextblockhash"
      ])
    })

    it("should get details for multiple block heights", async () => {
      req.body.hashes = [
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900",
        "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900"
      ]

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .times(2)
          .reply(200, { result: mockData.mockBlockHeaderConcise })
      }

      // Call the details API.
      const result = await getBlockHeaderBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })
  })

  describe("getChainTips()", () => {
    // block route handler.
    const getChainTips = blockchainRoute.testableComponents.getChainTips

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getChainTips(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getChainTips", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockChainTips })
      }

      const result = await getChainTips(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], ["height", "hash", "branchlen", "status"])
    })
  })

  describe("getDifficulty()", () => {
    // block route handler.
    const getDifficulty = blockchainRoute.testableComponents.getDifficulty

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getDifficulty(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getDifficulty", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: 4049809.205246544 })
      }

      const result = await getDifficulty(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })

  describe("getMempoolInfo()", () => {
    // block route handler.
    const getMempoolInfo = blockchainRoute.testableComponents.getMempoolInfo

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getMempoolInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getMempoolInfo", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockMempoolInfo })
      }

      const result = await getMempoolInfo(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "result",
        "bytes",
        "usage",
        "maxmempool",
        "mempoolminfree"
      ])
    })
  })

  describe("getRawMempool()", () => {
    // block route handler.
    const getRawMempool = blockchainRoute.testableComponents.getRawMempool

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result = await getRawMempool(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getMempoolInfo", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawMempool })
      }

      const result = await getRawMempool(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      // Not sure what other assertions should be made here.
    })
  })

  describe("getMempoolEntry()", () => {
    // block route handler.
    const getMempoolEntry =
      blockchainRoute.testableComponents.getMempoolEntrySingle

    it("should throw 400 if txid is empty", async () => {
      const result = await getMempoolEntry(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.txid = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getMempoolEntry(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getMempoolEntry", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: { error: "Transaction not in mempool" } })
      }

      req.params.txid = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getMempoolEntry(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.isString(result.error)
      assert.equal(result.error, "Transaction not in mempool")
    })
  })

  describe("#getMempoolEntryBulk", () => {
    // route handler.
    const getMempoolEntryBulk =
      blockchainRoute.testableComponents.getMempoolEntryBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await getMempoolEntryBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single txid", async () => {
      req.body.txids = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getMempoolEntryBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.txids = testArray

      const result = await getMempoolEntryBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    // Only execute on integration tests.
    if (process.env.TEST !== "unit") {
      // Dev-note: This test passes because it expects an error. TXIDs do not
      // stay in the mempool for long, so it does not work well for a unit or
      // integration test.
      it("should retrieve single mempool entry", async () => {
        req.body.txids = [
          `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`
        ]

        const result = await getMempoolEntryBulk(req, res)
        //console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ["error"])
        assert.isString(result.error)
        assert.equal(result.error, "Transaction not in mempool")
      })

      // Dev-note: This test passes because it expects an error. TXIDs do not
      // stay in the mempool for long, so it does not work well for a unit or
      // integration test.
      it("should retrieve multiple mempool entries", async () => {
        req.body.txids = [
          `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`,
          `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`
        ]

        const result = await getMempoolEntryBulk(req, res)
        //console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ["error"])
        assert.isString(result.error)
        assert.equal(result.error, "Transaction not in mempool")
      })
    }
  })

  describe("getTxOut()", () => {
    // block route handler.
    const getTxOut = blockchainRoute.testableComponents.getTxOut

    it("should throw 400 if txid is empty", async () => {
      const result = await getTxOut(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 400 if n is empty", async () => {
      req.params.txid = `sometxid`
      const result = await getTxOut(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "n can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.txid = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`
      req.params.n = 0

      const result = await getTxOut(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    // This test can only run for unit tests. See TODO at the top of this file.
    it("should GET /getTxOut", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockTxOut })
      }

      req.params.txid = `5747e6462e2c452a5d583fd6a5f82866cd8e4a86826c86d9a1842b7d023e0c0c`
      req.params.n = 1

      const result = await getTxOut(req, res)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAllKeys(result, [
        "bestblock",
        "confirmations",
        "value",
        "scriptPubKey",
        "coinbase"
      ])
      assert.hasAllKeys(result.scriptPubKey, [
        "asm",
        "hex",
        "reqSigs",
        "type",
        "addresses"
      ])
      assert.isArray(result.scriptPubKey.addresses)
    })
  })

  describe("getTxOutProof()", () => {
    const getTxOutProof = blockchainRoute.testableComponents.getTxOutProofSingle

    it("should throw 400 if txid is empty", async () => {
      const result = await getTxOutProof(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.txid = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getTxOutProof(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /getTxOutProof", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockTxOutProof })
      }

      req.params.txid = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getTxOutProof(req, res)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })
  })

  describe("#getTxOutProofBulk", () => {
    // route handler.
    const getTxOutProofBulk =
      blockchainRoute.testableComponents.getTxOutProofBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await getTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single txid", async () => {
      req.body.txids = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result = await getTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.txids = testArray

      const result = await getTxOutProofBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should GET proof for single txid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockTxOutProof })
      }

      req.body.txids = [
        `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`
      ]

      const result = await getTxOutProofBulk(req, res)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
    })

    it("should GET proof for multiple txids", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .times(2)
          .reply(200, { result: mockData.mockTxOutProof })
      }

      req.body.txids = [
        `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`,
        `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`
      ]

      const result = await getTxOutProofBulk(req, res)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "Correct length of returned array")
    })
  })

  describe("verifyTxOutProof()", () => {
    const verifyTxOutProof =
      blockchainRoute.testableComponents.verifyTxOutProofSingle

    it("should throw 400 if proof is empty", async () => {
      const result = await verifyTxOutProof(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "proof can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.proof = mockData.mockTxOutProof

      const result = await verifyTxOutProof(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.equal(res.statusCode, 503, "HTTP status code 503 expected.")
      assert.include(
        result.error,
        "Could not communicate with full node",
        "Error message expected"
      )
    })

    it("should GET /verifyTxOutProof", async () => {
      const expected =
        "d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: [expected] })
      }

      req.params.proof = mockData.mockTxOutProof

      const result = await verifyTxOutProof(req, res)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
    })
  })

  describe("#verifyTxOutProofBulk", () => {
    // route handler.
    const verifyTxOutProofBulk =
      blockchainRoute.testableComponents.verifyTxOutProofBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result = await verifyTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "proofs needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single txid", async () => {
      req.body.proofs = mockData.mockTxOutProof

      const result = await verifyTxOutProofBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "proofs needs to be an array",
        "Proper error message"
      )
    })

    it("should throw 400 error if addresses array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.proofs = testArray

      const result = await verifyTxOutProofBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should get single proof", async () => {
      const expected =
        "d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: [expected] })
      }

      req.body.proofs = [mockData.mockTxOutProof]

      const result = await verifyTxOutProofBulk(req, res)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
    })

    it("should get multiple proofs", async () => {
      const expected =
        "d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .times(2)
          .reply(200, { result: [expected] })
      }

      req.body.proofs = [mockData.mockTxOutProof, mockData.mockTxOutProof]

      const result = await verifyTxOutProofBulk(req, res)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
      assert.equal(result.length, 2)
    })
  })
})
