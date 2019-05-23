/*
  TESTS FOR THE RAWTRANSACTIONS.TS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.

  TODO:
  -Create e2e test for sendRawTransaction.

*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const rawtransactions = require("../../dist/routes/v2/rawtransactions")
const nock = require("nock") // HTTP mocking

let originalEnvVars // Used during transition from integration to unit tests.

// Mocking data.
//delete require.cache[require.resolve("./mocks/express-mocks")] // Fixes bug
const { mockReq, mockRes, mockNext } = require("./mocks/express-mocks")
const mockData = require("./mocks/raw-transactions-mocks")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 5 }

describe("#Raw-Transactions", () => {
  let req, res, next

  before(() => {
    // Save existing environment variables.
    originalEnvVars = {
      BITCOINCOM_BASEURL: process.env.BITCOINCOM_BASEURL,
      RPC_BASEURL: process.env.RPC_BASEURL,
      RPC_USERNAME: process.env.RPC_USERNAME,
      RPC_PASSWORD: process.env.RPC_PASSWORD
    }

    // Set default environment variables for unit tests.
    if (!process.env.TEST) process.env.TEST = "unit"
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
    next = mockNext

    // Explicitly reset the parmas and body.
    req.params = {}
    req.body = {}
    req.query = {}
    req.locals = {}

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
    process.env.BITCOINCOM_BASEURL = originalEnvVars.BITCOINCOM_BASEURL
    process.env.RPC_BASEURL = originalEnvVars.RPC_BASEURL
    process.env.RPC_USERNAME = originalEnvVars.RPC_USERNAME
    process.env.RPC_PASSWORD = originalEnvVars.RPC_PASSWORD
  })

  describe("#root", async () => {
    // root route handler.
    const root = rawtransactions.testableComponents.root

    it("should respond to GET for base route", async () => {
      const result = root(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.equal(result.status, "rawtransactions", "Returns static string")
    })
  })

  describe("decodeRawTransactionSingle()", () => {
    // block route handler.
    const decodeRawTransaction =
      rawtransactions.testableComponents.decodeRawTransactionSingle

    it("should throw error if hex is missing", async () => {
      const result = await decodeRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hex can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should GET /decodeRawTransaction", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockDecodeRawTransaction })
      }

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "txid",
        "hash",
        "size",
        "version",
        "locktime",
        "vin",
        "vout"
      ])
      assert.isArray(result.vin)
      assert.isArray(result.vout)
    })
  })

  describe("decodeRawTransactionBulk()", () => {
    const decodeRawTransactionBulk =
      rawtransactions.testableComponents.decodeRawTransactionBulk

    it("should throw 400 error if hexes array is missing", async () => {
      const result = await decodeRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hexes must be an array")
    })

    it("should throw 400 error if hexes array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.hexes = testArray

      const result = await decodeRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw 400 error if hexes is empty", async () => {
      req.body.hexes = [""]

      const result = await decodeRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Encountered empty hex")
    })

    it("should error on non-array single hex", async () => {
      req.body.hexes =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeRawTransactionBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "hexes must be an array",
        "Proper error message"
      )
    })

    it("should decode an array with a single hex", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockDecodeRawTransaction })
      }

      req.body.hexes = [
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"
      ]

      const result = await decodeRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "txid",
        "hash",
        "size",
        "version",
        "locktime",
        "vin",
        "vout"
      ])
      assert.isArray(result[0].vin)
      assert.isArray(result[0].vout)
    })

    it("should decode an array with multiple hexes", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .times(2)
          .reply(200, { result: mockData.mockDecodeRawTransaction })
      }

      req.body.hexes = [
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000",
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"
      ]

      const result = await decodeRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "txid",
        "hash",
        "size",
        "version",
        "locktime",
        "vin",
        "vout"
      ])
      assert.isArray(result[0].vin)
      assert.isArray(result[0].vout)
    })
  })

  describe("decodeScriptSingle()", () => {
    // block route handler.
    const decodeScriptSingle =
      rawtransactions.testableComponents.decodeScriptSingle

    it("should throw error if hex is missing", async () => {
      const result = await decodeScriptSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hex can not be empty")
    })

    it("should throw 503 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeScriptSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or greater expected."
      )
      //assert.include(result.error,"Network error: Could not communicate with full node","Error message expected")
    })

    it("should GET /decodeScriptSingle", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockDecodeScript })
      }

      req.params.hex =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeScriptSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["asm", "type", "p2sh"])
    })
  })

  describe("decodeScriptBulk()", () => {
    const decodeScriptBulk = rawtransactions.testableComponents.decodeScriptBulk

    it("should throw 400 error if hexes array is missing", async () => {
      const result = await decodeScriptBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hexes must be an array")
    })

    it("should throw 400 error if hexes array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.hexes = testArray

      const result = await decodeScriptBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw 400 error if hexes is empty", async () => {
      req.body.hexes = [""]

      const result = await decodeScriptBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Encountered empty hex")
    })

    it("should error on non-array single hex", async () => {
      req.body.hexes =
        "0200000001b9b598d7d6d72fc486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac00000000"

      const result = await decodeScriptBulk(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "hexes must be an array",
        "Proper error message"
      )
    })

    it("should decode an array with a single hex", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockDecodeScript })
      }

      req.body.hexes = [
        "4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16"
      ]

      const result = await decodeScriptBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAllKeys(result[0], ["asm", "type", "p2sh"])
    })

    it("should decode an array with a multiple hexes", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .times(2)
          .reply(200, { result: mockData.mockDecodeScript })
      }

      req.body.hexes = [
        "4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16",
        "4830450221009a51e00ec3524a7389592bc27bea4af5104a59510f5f0cfafa64bbd5c164ca2e02206c2a8bbb47eabdeed52f17d7df668d521600286406930426e3a9415fe10ed592012102e6e1423f7abde8b70bca3e78a7d030e5efabd3eb35c19302542b5fe7879c1a16"
      ]

      const result = await decodeScriptBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.equal(result.length, 2)
      assert.hasAllKeys(result[0], ["asm", "type", "p2sh"])
    })
  })

  describe("getRawTransactionBulk()", () => {
    // block route handler.
    const getRawTransactionBulk =
      rawtransactions.testableComponents.getRawTransactionBulk

    it("should throw 400 error if txids array is missing", async () => {
      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txids must be an array")
    })

    it("should throw 400 error if txids array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.txids = testArray

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw 400 error if txid is empty", async () => {
      req.body.txids = [""]

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Encountered empty TXID")
    })

    it("should throw 400 error if txid is invalid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "parameter 1 must be of length 64 (not 6)" }
          })
      }

      req.body.txids = ["abc123"]

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "parameter 1 must be of length 64 (not 6)")
    })

    it("should get concise transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionConcise })
      }

      req.body.txids = [
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"
      ]

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.isString(result[0])
    })

    it("should get verbose transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionVerbose })
      }

      req.body.txids = [
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"
      ]
      req.body.verbose = true

      const result = await getRawTransactionBulk(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        "hex",
        "txid",
        "hash",
        "size",
        "version",
        "locktime",
        "vin",
        "vout",
        "blockhash",
        "confirmations",
        "time",
        "blocktime"
      ])
      assert.isArray(result[0].vin)
      assert.isArray(result[0].vout)
    })
  })

  describe("getRawTransactionSingle()", () => {
    // block route handler.
    const getRawTransactionSingle =
      rawtransactions.testableComponents.getRawTransactionSingle

    it("should throw 400 error if txid is missing", async () => {
      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "txid can not be empty")
    })

    it("should throw 400 error if txid is invalid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "parameter 1 must be of length 64 (not 6)" }
          })
      }

      req.params.txid = "abc123"

      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "parameter 1 must be of length 64 (not 6)")
    })

    it("should get concise transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionConcise })
      }

      req.params.txid =
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"

      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.isString(result)
    })

    it("should get verbose transaction data", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, { result: mockData.mockRawTransactionVerbose })
      }

      req.params.txid =
        "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971"
      req.query.verbose = "true"

      const result = await getRawTransactionSingle(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAnyKeys(result, [
        "hex",
        "txid",
        "hash",
        "size",
        "version",
        "locktime",
        "vin",
        "vout",
        "blockhash",
        "confirmations",
        "time",
        "blocktime"
      ])
      assert.isArray(result.vin)
      assert.isArray(result.vout)
    })
  })

  describe("sendRawTransactionBulk()", () => {
    const sendRawTransaction =
      rawtransactions.testableComponents.sendRawTransactionBulk

    it("should throw 400 error if hexs array is missing", async () => {
      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "hex must be an array")
    })

    it("should throw 400 error if hexs array is too large", async () => {
      const testArray = []
      for (var i = 0; i < 25; i++) testArray.push("")

      req.body.hexes = testArray

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Array too large")
    })

    it("should throw 400 error if hex array element is empty", async () => {
      req.body.hexes = [""]

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.include(result.error, "Encountered empty hex")
    })

    it("should throw 500 error if hex is invalid", async () => {
      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "TX decode failed" }
          })
      }

      req.body.hexes = ["abc123"]

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "TX decode failed")
    })

    it("should submit hex encoded transaction", async () => {
      // This is a difficult test to run as transaction hex is invalid after a
      // block confirmation. So the unit tests simulates what the output 'should'
      // be, but the integration asserts an expected failure.

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "aef8848396e67532b42008b9d75b5a5a3459a6717740f31f0553b74102b4b118"
          })
      }

      req.body.hexes = [
        "0200000001189f7cf4303e2e0bcc5af4be323b9b397dd4104ca2de09528eb90a1450b8a999010000006a4730440220212ec2ffce136a30cec1bc86a40b08a2afdeb6f8dbd652d7bcb07b1aad6dfa8c022041f59585273b89d88879a9a531ba3272dc953f48ff57dad955b2dee70e76c0624121030143ffd18f1c4add75c86b2f930d9551d51f7a6bd786314247022b7afc45d231ffffffff0230d39700000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac58c20000000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac00000000"
      ]

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      if (process.env.TEST === "unit") {
        assert.isArray(result)
        assert.isString(result[0])

        // Integration test
      } else {
        assert.hasAllKeys(result, ["error"])
        assert.include(result.error, "transaction already in block chain")
      }
    })
  })

  describe("sendRawTransactionSingle()", () => {
    // block route handler.
    const sendRawTransaction =
      rawtransactions.testableComponents.sendRawTransactionSingle

    it("should throw an error for an empty hex", async () => {
      req.params.hex = ""

      const result = await sendRawTransaction(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "Encountered empty hex",
        "Proper error message"
      )
    })

    it("should throw an error for a non-string", async () => {
      req.params.hex = 456

      const result = await sendRawTransaction(req, res)

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(
        result.error,
        "hex must be a string",
        "Proper error message"
      )
    })

    it("should throw 500 when network issues", async () => {
      // Save the existing RPC URL.
      const savedUrl = process.env.BITCOINCOM_BASEURL
      const savedUrl2 = process.env.RPC_BASEURL

      // Manipulate the URL to cause a 500 network error.
      process.env.BITCOINCOM_BASEURL = "http://fakeurl/api/"
      process.env.RPC_BASEURL = "http://fakeurl/api/"

      req.params.hex =
        "0200000001189f7cf4303e2e0bcc5af4be323b9b397dd4104ca2de09528eb90a1450b8a999010000006a4730440220212ec2ffce136a30cec1bc86a40b08a2afdeb6f8dbd652d7bcb07b1aad6dfa8c022041f59585273b89d88879a9a531ba3272dc953f48ff57dad955b2dee70e76c0624121030143ffd18f1c4add75c86b2f930d9551d51f7a6bd786314247022b7afc45d231ffffffff0230d39700000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac58c20000000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac00000000"
      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      // Restore the saved URL.
      process.env.BITCOINCOM_BASEURL = savedUrl
      process.env.RPC_BASEURL = savedUrl2

      assert.isAbove(
        res.statusCode,
        499,
        "HTTP status code 500 or great expected."
      )
    })

    it("should throw an error for invalid hex", async () => {
      req.params.hex = "abc123"

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(500, {
            error: { message: "TX decode failed" }
          })
      }

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      assert.hasAllKeys(result, ["error"])
      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.")
      assert.include(result.error, "TX decode failed")
    })

    it("should GET /sendRawTransaction/:hex", async () => {
      // This is a difficult test to run as transaction hex is invalid after a
      // block confirmation. So the unit tests simulates what the output 'should'
      // be, but the integration asserts an expected failure.

      // Mock the RPC call for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.RPC_BASEURL}`)
          .post(``)
          .reply(200, {
            result:
              "aef8848396e67532b42008b9d75b5a5a3459a6717740f31f0553b74102b4b118"
          })
      }

      req.params.hex =
        "0200000001189f7cf4303e2e0bcc5af4be323b9b397dd4104ca2de09528eb90a1450b8a999010000006a4730440220212ec2ffce136a30cec1bc86a40b08a2afdeb6f8dbd652d7bcb07b1aad6dfa8c022041f59585273b89d88879a9a531ba3272dc953f48ff57dad955b2dee70e76c0624121030143ffd18f1c4add75c86b2f930d9551d51f7a6bd786314247022b7afc45d231ffffffff0230d39700000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac58c20000000000001976a914af64a026e06910c59463b000d18c3d125d7e951a88ac00000000"

      const result = await sendRawTransaction(req, res)
      //console.log(`result: ${util.inspect(result)}`)

      if (process.env.TEST === "unit") {
        assert.isString(result)

        // Integration test
      } else {
        assert.hasAllKeys(result, ["error"])
        assert.include(result.error, "transaction already in block chain")
      }
    })
  })
})
