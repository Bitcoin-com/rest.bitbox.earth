/*
  Mocks used for unit tests that interact with slpjs.
*/

const sinon = require("sinon")
const proxyquire = require("proxyquire")
const BigNumber = require("bignumber.js")
const slpMocks = require("./slp-mocks")

// Mock the BitboxNetwork class.
class BitboxNetwork {
  constructor() {}

  async getAllSlpBalancesAndUtxos(address) {
    return {
      satoshis_available_bch: 9996891,
      satoshis_in_slp_baton: 546,
      satoshis_in_slp_token: 546,
      satoshis_in_invalid_token_dag: 0,
      satoshis_in_invalid_baton_dag: 0,
      slpTokenBalances: {
        "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796": new BigNumber(
          123400000000
        )
      },
      slpTokenUtxos: {
        "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796": []
      },
      slpBatonUtxos: {
        "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796": []
      },
      nonSlpUtxos: [{}],
      invalidTokenUtxos: [],
      invalidBatonUtxos: []
    }
  }

  async getTokenInformation(txid) {
    BigNumber.set({ DECIMAL_PLACES: 8, ROUNDING_MODE: 4 })

    const obj = {
      versionType: 1,
      transactionType: 0,
      symbol: "SLPSDK",
      name: "SLP SDK example using BITBOX",
      documentUri: "developer.bitcoin.com",
      documentSha256: null,
      decimals: 8,
      batonVout: 2,
      containsBaton: true,
      genesisOrMintQuantity: new BigNumber(123400000000)
    }

    return obj
  }

  async getTransactionDetails(txid) {
    return slpMocks.mockTx
  }
}

// Mock the slpjs library.
const slpjs = {
  BitboxNetwork,
  slp: {},
  validator: {}
}

module.exports = slpjs
