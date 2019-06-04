/*
  TODO:
  -getRawMempool
  --Add tests for 'verbose' input values
  -getMempoolEntry & getMempoolEntryBulk
  --Needs e2e test to create unconfirmed tx, for real-world test.
*/

// imports
import * as chai from "chai"
import blockchainV2 from "./../../../src/routes/v2/blockchain"

// consts
const assert = chai.assert
const nock = require("nock") // HTTP mocking

const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

if (!process.env.TEST) process.env.TEST = "unit"

// Mocking data.
const { mockReq, mockRes } = require("./../mocks/express-mocks")
const mockData = require("./../mocks/blockchain-mocks")

let originalEnvVars: any // Used during transition from integration to unit tests.

describe("#BlockchainRouter", () => {
  let req: any
  let res: any
  let next: any

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

  // describe("#root", () => {
  //   // root route handler.
  //   const root = blockchainV2.testableComponents.root

  //   it("should respond to GET for base route", async () => {
  //     const result: any = root(req, res, next)

  //     assert.equal(result.status, "blockchain", "Returns static string")
  //   })
  // })

  describe("getBestBlockHash()", () => {
    // block route handler.
    const getBestBlockHash = blockchainV2.testableComponents.getBestBlockHash

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result: any = await getBestBlockHash(req, res, next)
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

      const result: any = await getBestBlockHash(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
      assert.equal(result.length, 64, "Hash string is fixed length")
    })
  })

  describe("getBlockchainInfo()", () => {
    // block route handler.
    const getBlockchainInfo = blockchainV2.testableComponents.getBlockchainInfo

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result: any = await getBlockchainInfo(req, res, next)
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

      const result: any = await getBlockchainInfo(req, res, next)
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
    const getBlockCount = blockchainV2.testableComponents.getBlockCount

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result: any = await getBlockCount(req, res, next)
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

      const result: any = await getBlockCount(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })

  describe("getBlockHeaderSingle()", async () => {
    const getBlockHeader = blockchainV2.testableComponents.getBlockHeaderSingle

    it("should throw 400 error if hash is missing", async () => {
      const result: any = await getBlockHeader(req, res, next)
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

      const result: any = await getBlockHeader(req, res, next)
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

      const result: any = await getBlockHeader(req, res, next)
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

      const result: any = await getBlockHeader(req, res, next)
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
      blockchainV2.testableComponents.getBlockHeaderBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await getBlockHeaderBulk(req, res, next)

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

      const result: any = await getBlockHeaderBulk(req, res, next)

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

      const result: any = await getBlockHeaderBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw a 400 error for an invalid hash", async () => {
      req.body.hashes = ["badHash"]

      await getBlockHeaderBulk(req, res, next)
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

        const result: any = await getBlockHeaderBulk(req, res, next)

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
      const result: any = await getBlockHeaderBulk(req, res, next)
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
      const result: any = await getBlockHeaderBulk(req, res, next)
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
      const result: any = await getBlockHeaderBulk(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "2 outputs for 2 inputs")
    })
  })

  describe("getChainTips()", () => {
    // block route handler.
    const getChainTips = blockchainV2.testableComponents.getChainTips

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "huttp://fakeurl/api/"

      const result: any = await getChainTips(req, res, next)
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

      const result: any = await getChainTips(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], ["height", "hash", "branchlen", "status"])
    })
  })

  describe("getDifficulty()", () => {
    // block route handler.
    const getDifficulty = blockchainV2.testableComponents.getDifficulty

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result: any = await getDifficulty(req, res, next)
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

      const result: any = await getDifficulty(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isNumber(result)
    })
  })

  describe("getMempoolInfo()", () => {
    // block route handler.
    const getMempoolInfo = blockchainV2.testableComponents.getMempoolInfo

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result: any = await getMempoolInfo(req, res, next)
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

      const result: any = await getMempoolInfo(req, res, next)
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
    const getRawMempool = blockchainV2.testableComponents.getRawMempool

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      const result: any = await getRawMempool(req, res, next)
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

      const result: any = await getRawMempool(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      // Not sure what other assertions should be made here.
    })
  })

  describe("getMempoolEntry()", () => {
    // block route handler.
    const getMempoolEntry =
      blockchainV2.testableComponents.getMempoolEntrySingle

    it("should throw 400 if txid is empty", async () => {
      const result: any = await getMempoolEntry(req, res, next)
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

      const result: any = await getMempoolEntry(req, res, next)
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

      const result: any = await getMempoolEntry(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.isString(result.error)
      assert.equal(result.error, "Transaction not in mempool")
    })
  })

  describe("#getMempoolEntryBulk", () => {
    // route handler.
    const getMempoolEntryBulk =
      blockchainV2.testableComponents.getMempoolEntryBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await getMempoolEntryBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single txid", async () => {
      req.body.txids = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result: any = await getMempoolEntryBulk(req, res, next)

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

      const result: any = await getMempoolEntryBulk(req, res, next)
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

        const result: any = await getMempoolEntryBulk(req, res, next)
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

        const result: any = await getMempoolEntryBulk(req, res, next)
        //console.log(`result: ${util.inspect(result)}`)

        assert.hasAllKeys(result, ["error"])
        assert.isString(result.error)
        assert.equal(result.error, "Transaction not in mempool")
      })
    }
  })

  describe("getTxOut()", () => {
    // block route handler.
    const getTxOut = blockchainV2.testableComponents.getTxOut

    it("should throw 400 if txid is empty", async () => {
      const result: any = await getTxOut(req, res, next)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 400 if n is empty", async () => {
      req.params.txid = `sometxid`
      const result: any = await getTxOut(req, res, next)
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

      const result: any = await getTxOut(req, res, next)
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

      const result: any = await getTxOut(req, res, next)
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
    const getTxOutProof = blockchainV2.testableComponents.getTxOutProofSingle

    it("should throw 400 if txid is empty", async () => {
      const result: any = await getTxOutProof(req, res, next)
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

      const result: any = await getTxOutProof(req, res, next)
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

      const result: any = await getTxOutProof(req, res, next)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })
  })

  describe("#getTxOutProofBulk", () => {
    // route handler.
    const getTxOutProofBulk = blockchainV2.testableComponents.getTxOutProofBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await getTxOutProofBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "txids needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single txid", async () => {
      req.body.txids = `d65881582ff2bff36747d7a0d0e273f10281abc8bd5c15df5d72f8f3fa779cde`

      const result: any = await getTxOutProofBulk(req, res, next)

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

      const result: any = await getTxOutProofBulk(req, res, next)
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

      const result: any = await getTxOutProofBulk(req, res, next)
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

      const result: any = await getTxOutProofBulk(req, res, next)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 2, "Correct length of returned array")
    })
  })

  describe("verifyTxOutProof()", () => {
    const verifyTxOutProof =
      blockchainV2.testableComponents.verifyTxOutProofSingle

    it("should throw 400 if proof is empty", async () => {
      const result: any = await verifyTxOutProof(req, res, next)
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

      const result: any = await verifyTxOutProof(req, res, next)
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

      const result: any = await verifyTxOutProof(req, res, next)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
    })
  })

  describe("#verifyTxOutProofBulk", () => {
    // route handler.
    const verifyTxOutProofBulk =
      blockchainV2.testableComponents.verifyTxOutProofBulk

    it("should throw an error for an empty body", async () => {
      req.body = {}

      const result: any = await verifyTxOutProofBulk(req, res, next)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "proofs needs to be an array",
        "Proper error message"
      )
    })

    it("should error on non-array single txid", async () => {
      req.body.proofs = mockData.mockTxOutProof

      const result: any = await verifyTxOutProofBulk(req, res, next)

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

      const result: any = await verifyTxOutProofBulk(req, res, next)
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

      const result: any = await verifyTxOutProofBulk(req, res, next)
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

      const result: any = await verifyTxOutProofBulk(req, res, next)
      //console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.isString(result[0])
      assert.equal(result[0], expected)
      assert.equal(result.length, 2)
    })
  })
})
