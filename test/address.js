/*
  TESTS FOR THE ADDRESS.JS LIBRARY

  This test file uses the environment variable TEST to switch between unit
  and integration tests. By default, TEST is set to 'unit'. Set this variable
  to 'integration' to run the tests against BCH mainnet.


  To-Do:
  -/details/:address
  --Verify to/from query options work correctly.
*/

"use strict";

const chai = require("chai");
const assert = chai.assert;
const addressRoute = require("../routes/address"); // Library to test.
const nock = require("nock"); // HTTP mocking

// Mocking data.
const { mockReq, mockRes } = require("./mocks/express-mocks");
const mockData = require("./mocks/address-mock");

// used for debugging - remove this.
const util = require("util");
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
};

before(() => {
  // Set default environment variables for unit tests.
  if (!process.env.TEST) process.env.TEST = "unit";
  if (process.env.TEST === "unit") process.env.BITCOINCOM_BASEURL = "http://fakeurl/api";
});

describe("#AddressRouter", () => {
  let req, res;

  // Setup the mocks before each test.
  beforeEach(() => {
    // Mock the req and res objects used by Express routes.
    req = mockReq;
    res = mockRes;
  });

  describe("#root", () => {
    // root route handler.
    const root = addressRoute.testableComponents.root;

    it("should return status of 'address' for GET /", () => {
      const result = root(req, res);

      assert.equal(result.status, "address", "Returns static string");
    });
  });

  describe("#AddressDetails", () => {
    // details route handler.
    const details = addressRoute.testableComponents.details2;

    it("should throw an error for an invalid address", async () => {
      req.params = {
        address: [`02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`],
      };

      const result = await details(req, res);

      assert.equal(res.statusCode, 400, "HTTP status code 400 expected.");
      assert.include(result, "Invalid BCH address", "Proper error message");
    });

    it("should throw 500 when network issues", async () => {
      const savedUrl = process.env.BITCOINCOM_BASEURL;

      try {
        req.params = {
          address: [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`],
        };

        // Switch the Insight URL to something that will error out.
        process.env.BITCOINCOM_BASEURL = "http://fakeurl/api";

        const result = await details(req, res);

        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl;

        assert.equal(res.statusCode, 500, "HTTP status code 500 expected.");
        assert.include(result, "Error", "Error message expected");
      } catch (err) {
        // Restore the saved URL.
        process.env.BITCOINCOM_BASEURL = savedUrl;
      }
    });

    it("should GET /details/:address single address", async () => {
      req.params = {
        address: [`qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`],
      };

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/1Fg4r9iDrEkCcDmHTy2T79EusNfhyQpu7W`)
          .reply(200, mockData.mockAddressDetails);
      }

      // Call the details API.
      const result = await details(req, res);
      //console.log(`result1: ${JSON.stringify(result, null, 2)}`); // Used for debugging.

      // Assert that required fields exist in the returned object.
      assert.exists(result[0].addrStr);
      assert.exists(result[0].balance);
      assert.exists(result[0].balanceSat);
      assert.exists(result[0].totalReceived);
      assert.exists(result[0].totalReceivedSat);
      assert.exists(result[0].totalSent);
      assert.exists(result[0].totalSentSat);
      assert.exists(result[0].unconfirmedBalance);
      assert.exists(result[0].unconfirmedBalanceSat);
      assert.exists(result[0].unconfirmedTxApperances);
      assert.exists(result[0].txApperances);
      assert.isArray(result[0].transactions);
      assert.exists(result[0].legacyAddress);
      assert.exists(result[0].cashAddress);
    });

    it("should GET non-array single address", async () => {
      req.params = {
        address: `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`,
      };

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/1Fg4r9iDrEkCcDmHTy2T79EusNfhyQpu7W`)
          .reply(200, mockData.mockAddressDetails);
      }

      // Call the details API.
      const result = await details(req, res);
      //console.log(`result1: ${JSON.stringify(result, null, 2)}`); // Used for debugging.

      // Assert that required fields exist in the returned object.
      assert.exists(result[0].addrStr);
      assert.exists(result[0].balance);
      assert.exists(result[0].balanceSat);
      assert.exists(result[0].totalReceived);
      assert.exists(result[0].totalReceivedSat);
      assert.exists(result[0].totalSent);
      assert.exists(result[0].totalSentSat);
      assert.exists(result[0].unconfirmedBalance);
      assert.exists(result[0].unconfirmedBalanceSat);
      assert.exists(result[0].unconfirmedTxApperances);
      assert.exists(result[0].txApperances);
      assert.isArray(result[0].transactions);
      assert.exists(result[0].legacyAddress);
      assert.exists(result[0].cashAddress);
    });

    it("should GET /details/:address array of addresses", async () => {
      //await _sleep(1000); // Used for debugging.

      req.params = {
        address: [
          `qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c`,
          `qzmrfwd5wprnkssn5kf6xvpxa8fqrhch4vs8c64sq4`,
        ],
      };

      // Mock the Insight URL for unit tests.
      if (process.env.TEST === "unit") {
        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/1Fg4r9iDrEkCcDmHTy2T79EusNfhyQpu7W`)
          .reply(200, mockData.mockAddressDetails);

        nock(`${process.env.BITCOINCOM_BASEURL}`)
          .get(`/addr/1HcR9LemjZw5mw7bAeo39685LKjcKUyDL4`)
          .reply(200, mockData.mockAddressDetails);
      }

      // Call the details API.
      const result = await details(req, res);
      //console.log(`result: ${JSON.stringify(result, null, 2)}`);

      assert.isArray(result);
      assert.equal(result.length, 2, "2 outputs for 2 inputs");
    });
  });

  /*
  describe("#AddressUtxo", () => {
    it("should GET /utxo/:address single address", (done) => {
      let mockRequest = httpMocks.createRequest({
        method: "GET",
        url: '/utxo/["qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"%5D'
      });
      let mockResponse = httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
      });
      addressRoute(mockRequest, mockResponse);

      mockResponse.on('end', () => {
        let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData())[0][0]);
        assert.deepEqual(actualResponseBody, [ 'txid', 'vout', 'scriptPubKey', 'amount', 'satoshis', 'height', 'confirmations', 'legacyAddress', 'cashAddress']);
        done();
      });
    });

    it("should GET /utxo/:address array of addresses", (done) => {
      let mockRequest = httpMocks.createRequest({
        method: "GET",
        url: '/utxo/["qql6r7khtjgwy3ufnjtsczvaf925hyw49cudht57tr", "qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"%5D'
      });
      let mockResponse = httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
      });
      addressRoute(mockRequest, mockResponse);

      mockResponse.on('end', () => {
        let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData())[1][0]);
        assert.deepEqual(actualResponseBody, [ 'txid', 'vout', 'scriptPubKey', 'amount', 'satoshis', 'height', 'confirmations', 'legacyAddress', 'cashAddress']);
        done();
      });
    });
  });
  */
  /*
  describe("#AddressUnconfirmed", () => {
    it("should GET /unconfirmed/:address single address", (done) => {
      let mockRequest = httpMocks.createRequest({
        method: "GET",
        url: '/unconfirmed/["qql6r7khtjgwy3ufnjtsczvaf925hyw49cudht57tr"%5D'
      });
      let mockResponse = httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
      });
      addressRoute(mockRequest, mockResponse);

      mockResponse.on('end', () => {
        let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData())[0]);
        assert.deepEqual(actualResponseBody, []);
        // assert.deepEqual(actualResponseBody, [ 'txid', 'vout', 'scriptPubKey', 'amount', 'satoshis', 'height', 'confirmations', 'legacyAddress', 'cashAddress']);
        done();
      });
    });

    it("should GET /unconfirmed/:address array of addresses", (done) => {
      let mockRequest = httpMocks.createRequest({
        method: "GET",
        url: '/unconfirmed/["qql6r7khtjgwy3ufnjtsczvaf925hyw49cudht57tr", "qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"%5D'
      });
      let mockResponse = httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
      });
      addressRoute(mockRequest, mockResponse);

      mockResponse.on('end', () => {
        let actualResponseBody = Object.keys(JSON.parse(mockResponse._getData())[0]);
        assert.deepEqual(actualResponseBody, []);
        // assert.deepEqual(actualResponseBody, [ 'txid', 'vout', 'scriptPubKey', 'amount', 'satoshis', 'height', 'confirmations', 'legacyAddress', 'cashAddress']);
        done();
      });
    });
  });
  */
});

// Promise-based sleep.
function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
