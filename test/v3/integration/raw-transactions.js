/*
  These integration tests are intended to be run against a live local copy of
  rest.bitcoin.com. They exercise the endpoints in the same way the SDK or
  end-user application would. These tests were created to replace the parts
  removed from the swagger UI, that otherwise would have excersiced these endpoints.

  TODO:
  -/rawtransactions/sendRawTransaction is more appropropriate for an e2e test,
  so it is omitted here.
*/

"use strict"

const chai = require("chai")
const assert = chai.assert
const rawtransactions = require("../../../dist/routes/v2/rawtransactions")
const rp = require("request-promise")
const SERVER = `https://rest.btctest.net/v2/`
//const SERVER = `http://localhost:3000/v2/`

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const mockData = require("../mocks/raw-transactions-mocks")

describe("#Raw-Transactions", () => {
  describe("#root", () => {
    it(`should return root`, async () => {
      const options = {
        method: "GET",
        uri: `${SERVER}rawtransactions/`,
        resolveWithFullResponse: true,
        json: true
      }

      const result = await rp(options)
      //console.log(`result: ${JSON.stringify(result, null, 0)}`)

      assert.equal(result.body.status, "rawtransactions")
    })
  })

  // describe("#whCreateTx", () => {
  //   it(`should return tx hex`, async () => {
  //     const minIn = {
  //       txid:
  //         "f7ed9cf23dee85910f6269c9a101a75fcfd2f3c6fc81f17fad824ff7aaf99ab2",
  //       vout: 1
  //     }

  //     const options = {
  //       method: "PUT",
  //       uri: `${SERVER}rawtransactions/create`,
  //       resolveWithFullResponse: true,
  //       json: true,
  //       body: {
  //         //inputs: [mockData.mockWHCreateInput],
  //         inputs: [minIn],
  //         outputs: {}
  //       }
  //     }

  //     const result = await rp(options)
  //     //console.log(`result.body: ${JSON.stringify(result.body, null, 0)}`)

  //     assert.equal(
  //       result.body,
  //       "0200000001b29af9aaf74f82ad7ff181fcc6f3d2cf5fa701a1c969620f9185ee3df29cedf70100000000ffffffff0000000000"
  //     )
  //   })
  // })

  // describe("#whOpReturn", () => {
  //   it(`should return tx hex`, async () => {
  //     const options = {
  //       method: "PUT",
  //       uri: `${SERVER}rawtransactions/opreturn`,
  //       resolveWithFullResponse: true,
  //       json: true,
  //       body: {
  //         rawtx: "01000000000000000000",
  //         payload: "00000000000000020000000006dac2c0"
  //       }
  //     }

  //     const result = await rp(options)
  //     //console.log(`result.body: ${JSON.stringify(result.body, null, 0)}`)

  //     assert.equal(
  //       result.body,
  //       "0100000000010000000000000000166a140877686300000000000000020000000006dac2c000000000"
  //     )
  //   })
  // })

  // describe("#whReference", () => {
  //   it(`should return tx hex`, async () => {
  //     const options = {
  //       method: "PUT",
  //       uri: `${SERVER}rawtransactions/reference`,
  //       resolveWithFullResponse: true,
  //       json: true,
  //       body: {
  //         rawtx:
  //           "0100000001a7a9402ecd77f3c9f745793c9ec805bfa2e14b89877581c734c774864247e6f50400000000ffffffff03aa0a0000000000001976a9146d18edfe073d53f84dd491dae1379f8fb0dfe5d488ac5c0d0000000000004751210252ce4bdd3ce38b4ebbc5a6e1343608230da508ff12d23d85b58c964204c4cef3210294cc195fc096f87d0f813a337ae7e5f961b1c8a18f1f8604a909b3a5121f065b52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000",
  //         destination: "bitcoincash:qrn60nerx5zug4u4hal06atep3lzhtecvy4pxk75lf",
  //         amount: 0.005
  //       }
  //     }

  //     const result = await rp(options)
  //     //console.log(`result.body: ${JSON.stringify(result.body, null, 0)}`)

  //     assert.isString(result.body)
  //   })
  // })

  // describe("#whChangeOutput", () => {
  //   it(`should return tx hex`, async () => {
  //     const options = {
  //       method: "PUT",
  //       uri: `${SERVER}rawtransactions/change`,
  //       resolveWithFullResponse: true,
  //       json: true,
  //       body: {
  //         rawtx:
  //           "0100000001b15ee60431ef57ec682790dec5a3c0d83a0c360633ea8308fbf6d5fc10a779670400000000ffffffff025c0d00000000000047512102f3e471222bb57a7d416c82bf81c627bfcd2bdc47f36e763ae69935bba4601ece21021580b888ff56feb27f17f08802ebed26258c23697d6a462d43fc13b565fda2dd52aeaa0a0000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac00000000",
  //         destination: "bitcoincash:qrn60nerx5zug4u4hal06atep3lzhtecvy4pxk75lf",
  //         prevtxs: [
  //           {
  //             txid:
  //               "6779a710fcd5f6fb0883ea3306360c3ad8c0a3c5de902768ec57ef3104e65eb1",
  //             vout: 4,
  //             scriptPubKey:
  //               "76a9147b25205fd98d462880a3e5b0541235831ae959e588ac",
  //             value: 0.00068257
  //           }
  //         ],
  //         fee: 0.000035
  //       }
  //     }

  //     const result = await rp(options)
  //     //console.log(`result.body: ${JSON.stringify(result.body, null, 0)}`)

  //     assert.isString(result.body)
  //   })
  // })

  // describe("#whInput", () => {
  //   it(`should return tx hex`, async () => {
  //     const options = {
  //       method: "PUT",
  //       uri: `${SERVER}rawtransactions/input`,
  //       resolveWithFullResponse: true,
  //       json: true,
  //       body: {
  //         txid:
  //           "b006729017df05eda586df9ad3f8ccfee5be340aadf88155b784d1fc0e8342ee",
  //         n: 0
  //       }
  //     }

  //     const result = await rp(options)
  //     //console.log(`result.body: ${JSON.stringify(result.body, null, 0)}`)

  //     assert.isString(result.body)
  //   })
  // })

  describe("#getRawTransaction", () => {
    it(`should return tx hex`, async () => {
      const options = {
        method: "POST",
        uri: `${SERVER}rawtransactions/getRawTransaction`,
        resolveWithFullResponse: true,
        json: true,
        body: {
          txids: [
            "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098"
          ],
          verbose: true
        }
      }

      const result = await rp(options)
      // console.log(`result.body: ${util.inspect(result.body)}`)

      assert.isArray(result.body)
    })
  })
})
