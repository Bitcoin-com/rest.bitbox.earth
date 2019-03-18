/*
 */

"use strict"

// CUSTOMIZE THESE VARIABLES
const SERVER = `https://rest.btctest.net/v2/`
//const SERVER = `http://localhost:3000/v2/`
//const PRO_TIER_PASS = ""
const PRO_TIER_PASS = "BITBOX"

const chai = require("chai")
const assert = chai.assert
const axios = require("axios")

// Used for debugging.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#rate limits", () => {
  it("should get control/getInfo() with no auth", async () => {
    const options = {
      method: "GET",
      url: `${SERVER}control/getInfo`
    }

    const result = await axios(options)
    //console.log(`result.status: ${result.status}`)
    //console.log(`result.data: ${util.inspect(result.data)}`)

    assert.equal(result.status, 200)
    assert.hasAnyKeys(result.data, ["version"])
  })

  it("should trigger rate-limit handler if rate limits exceeds 60 request per minute", async () => {
    try {
      // Actual rate limit is 60 per minute X 4 nodes = 240 rpm.
      const options = {
        method: "GET",
        url: `${SERVER}control/getInfo`
      }

      const promises = []
      for (let i = 0; i < 250; i++) {
        const promise = axios(options)
        promises.push(promise)
      }

      await Promise.all(promises)

      assert.equal(true, false, "Unexpected result!")
    } catch (err) {
      //console.log(`err.response: ${util.inspect(err.response)}`)

      assert.equal(err.response.status, 429)
      assert.include(err.response.data.error, "Too many requests")
    }
  })

  it("should not trigger rate-limit handler if correct pro-tier password is used", async () => {
    try {
      const username = "BITBOX"

      const combined = `${username}:${PRO_TIER_PASS}`
      const base64Credential = Buffer.from(combined).toString("base64")
      const readyCredential = `Basic ${base64Credential}`

      const options = {
        method: "GET",
        url: `${SERVER}control/getInfo`,
        headers: { Authorization: readyCredential }
      }

      const promises = []
      for (let i = 0; i < 250; i++) {
        const promise = axios(options)
        promises.push(promise)
      }

      await Promise.all(promises)

      assert.equal(true, true, "Not throwing an error is a pass!")
    } catch (err) {
      console.log(`err.response: ${util.inspect(err.response)}`)

      assert.equal(
        true,
        false,
        "This error handler should not have been triggered. Is the password correct?"
      )
    }
  })
})
