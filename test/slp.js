"use strict"

//const chai = require("chai");
const assert = require("assert")
const httpMocks = require("node-mocks-http")
const slpRoute = require("../routes/v1/slp")

describe("#SlpRouter", () => {
  describe("#root", () => {
    it("should return 'slp' for GET /", () => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/"
      })
      const mockResponse = httpMocks.createResponse()
      slpRoute(mockRequest, mockResponse)
      const actualResponseBody = mockResponse._getData()
      const expectedResponseBody = {
        status: "slp"
      }
      assert.deepEqual(JSON.parse(actualResponseBody), expectedResponseBody)
    })
  })

  describe("#listTokens", () => {
    it("should GET /list", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url: "/list"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      slpRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())[0]
        )
        assert.deepEqual(actualResponseBody, [
          "id",
          "timestamp",
          "symbol",
          "name",
          "document"
        ])
        done()
      })
    })
  })

  describe("#listTokenById", () => {
    it("should GET /list/:id", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/list/259908ae44f46ef585edef4bcc1e50dc06e4c391ac4be929fae27235b8158cf1"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      slpRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "id",
          "timestamp",
          "symbol",
          "name",
          "document"
        ])
        done()
      })
    })
  })

  describe("#balancesForAddress", () => {
    it("should GET /balancesForAddress/:address", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/balancesForAddress/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      slpRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "satoshis_available",
          "satoshis_locked_in_minting_baton",
          "satoshis_locked_in_token",
          "1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125",
          "047918c612e94cce03876f1ad2bd6c9da43b586026811d9b0d02c3c3e910f972",
          "slpAddress",
          "cashAddress",
          "legacyAddress"
        ])
        done()
      })
    })
  })

  describe("#balancesForAddressById", () => {
    it("should GET /balances/:address/:id", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/balancesForAddress/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m/1cda254d0a995c713b7955298ed246822bee487458cd9747a91d9e81d9d28125"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      slpRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "balance",
          "slpAddress",
          "cashAddress",
          "legacyAddress"
        ])
        done()
      })
    })
  })

  describe("#addressConvert", () => {
    it("should GET /address/convert/:address", done => {
      const mockRequest = httpMocks.createRequest({
        method: "GET",
        url:
          "/address/convert/simpleledger:qz9tzs6d5097ejpg279rg0rnlhz546q4fsnck9wh5m"
      })
      const mockResponse = httpMocks.createResponse({
        eventEmitter: require("events").EventEmitter
      })
      slpRoute(mockRequest, mockResponse)

      mockResponse.on("end", () => {
        const actualResponseBody = Object.keys(
          JSON.parse(mockResponse._getData())
        )
        assert.deepEqual(actualResponseBody, [
          "slpAddress",
          "cashAddress",
          "legacyAddress"
        ])
        done()
      })
    })
  })
})