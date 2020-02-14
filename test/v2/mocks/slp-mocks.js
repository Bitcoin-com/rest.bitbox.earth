/*
  This library contains mocking data for running unit tests.
*/

const mockList = {
  t: [
    {
      tokenDetails: {
        tokenIdHex:
          "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb",
        documentUri: "",
        documentSha256: "",
        symbol: "NAKAMOTO",
        name: "NAKAMOTO",
        decimals: 8
      },
      tokenStats: {
        qty_valid_txns_since_genesis: 241,
        qty_valid_token_utxos: 151,
        qty_valid_token_addresses: 113,
        qty_token_circulating_supply: "20995990",
        qty_token_burned: "4010",
        qty_token_minted: "21000000",
        qty_satoshis_locked_up: 81900
      }
    }
  ]
}

const mockSingleToken = {
  t: [
    {
      tokenDetails: {
        decimals: 8,
        tokenIdHex:
          "650dea14c77f4d749608e36e375450c9ac91deb8b1b53e50cb0de2059a52d19a",
        timestamp: "2018-08-26 07:06",
        transactionType: "GENESIS",
        versionType: 1,
        documentUri: "",
        documentSha256Hex: null,
        symbol: "",
        name: "TESTYCOIN",
        batonVout: null,
        containsBaton: false,
        genesisOrMintQuantity: "9999",
        sendOutputs: null
      },
      tokenStats: {
        block_created: 1253802,
        block_last_active_send: 1253802,
        block_last_active_mint: null,
        qty_valid_txns_since_genesis: 2,
        qty_valid_token_utxos: 0,
        qty_valid_token_addresses: 0,
        qty_token_minted: "9999",
        qty_token_burned: "9999",
        qty_token_circulating_supply: "0",
        qty_satoshis_locked_up: 0,
        minting_baton_status: "NEVER_CREATED"
      }
    }
  ]
}

const mockSingleTokenError = {
  t: []
}

const mockSingleAddress = {
  g: [
    {
      _id: "6b081fcd1f78b187be1464313dac8ff257251b727a42b613552a4040870aeb29",
      balanceString: "4616984",
      slpAddress: "slptest:pz0qcslrqn7hr44hsszwl4lw5r6udkg6zqv7sq3kk7"
    }
  ],
  t: [
    {
      tokenDetails: {
        decimals: 8,
        tokenIdHex:
          "6b081fcd1f78b187be1464313dac8ff257251b727a42b613552a4040870aeb29",
        timestamp: "2019-02-25 10:05",
        transactionType: "GENESIS",
        versionType: 1,
        documentUri: "https://developer.bitcoin.com",
        documentSha256Hex: "",
        symbol: "DEV",
        name: "DEVCOIN",
        batonVout: 2,
        containsBaton: true,
        genesisOrMintQuantity: "500000000",
        sendOutputs: null
      },
      tokenStats: {
        block_created: 571272,
        block_last_active_send: 574758,
        block_last_active_mint: 571272,
        qty_valid_txns_since_genesis: 172,
        qty_valid_token_utxos: 170,
        qty_valid_token_addresses: 170,
        qty_token_minted: "1000000000",
        qty_token_burned: "4.99999995",
        qty_token_circulating_supply: "999999995.00000005",
        qty_satoshis_locked_up: 92820,
        minting_baton_status: "ALIVE"
      }
    }
  ]
}

const mockTx = {
  txid: "57b3082a2bf269b3d6f40fee7fb9c664e8256a88ca5ee2697c05b9457822d446",
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: "61e71554a3dc18158f30d9e8f5c9b6641a789690b32302899f81cbea9fe3bb49",
      vout: 2,
      sequence: 4294967295,
      n: 0,
      scriptSig: {
        hex:
          "4730440220409e79fec552f01203f41d3d621ae3db89c720af261c8268ce5f0453de009f5d022001e7ffefeba7b0716d32ea55cb6ace267b6ee9cbcc8a017bb9c3b6acf7889418412103c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585",
        asm:
          "30440220409e79fec552f01203f41d3d621ae3db89c720af261c8268ce5f0453de009f5d022001e7ffefeba7b0716d32ea55cb6ace267b6ee9cbcc8a017bb9c3b6acf7889418[ALL|FORKID] 03c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585"
      },
      value: 546,
      legacyAddress: "mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL",
      cashAddress: "bchtest:qz4qnxcxwvmacgye8wlakhz0835x0w3vtvaga95c09"
    },
    {
      txid: "61e71554a3dc18158f30d9e8f5c9b6641a789690b32302899f81cbea9fe3bb49",
      vout: 1,
      sequence: 4294967295,
      n: 1,
      scriptSig: {
        hex:
          "483045022100a743bee56c99bd103be48a78fa4c7342100815d9d2448dbe6e1d338c3a13b241022066728b5279fc22eef5cd019582ff34771e29175835fc98aa3168a1548fd78ac8412103c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585",
        asm:
          "3045022100a743bee56c99bd103be48a78fa4c7342100815d9d2448dbe6e1d338c3a13b241022066728b5279fc22eef5cd019582ff34771e29175835fc98aa3168a1548fd78ac8[ALL|FORKID] 03c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585"
      },
      value: 546,
      legacyAddress: "mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL",
      cashAddress: "bchtest:qz4qnxcxwvmacgye8wlakhz0835x0w3vtvaga95c09"
    },
    {
      txid: "61e71554a3dc18158f30d9e8f5c9b6641a789690b32302899f81cbea9fe3bb49",
      vout: 3,
      sequence: 4294967295,
      n: 2,
      scriptSig: {
        hex:
          "483045022100821473902eec5f1ce7d43b1ba7f9ec453bfe8b8dfc3de3e0723c883ab109922f02206162960e80618531fab2c16aee260fddd7979bab62471c8686af7de75f8732ec412103c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585",
        asm:
          "3045022100821473902eec5f1ce7d43b1ba7f9ec453bfe8b8dfc3de3e0723c883ab109922f02206162960e80618531fab2c16aee260fddd7979bab62471c8686af7de75f8732ec[ALL|FORKID] 03c87f0ec048a0771bdb60533d45cac88c6974afeb055a65edd663c2f947335585"
      },
      value: 9997521,
      legacyAddress: "mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL",
      cashAddress: "bchtest:qz4qnxcxwvmacgye8wlakhz0835x0w3vtvaga95c09"
    }
  ],
  vout: [
    {
      value: "0.00000000",
      n: 0,
      scriptPubKey: {
        hex:
          "6a04534c500001010453454e44207ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796080000000049504f80080000001c71e64280",
        asm:
          "OP_RETURN 5262419 1 1145980243 7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796 0000000049504f80 0000001c71e64280"
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    },
    {
      value: "0.00000546",
      n: 1,
      scriptPubKey: {
        hex: "76a914396b8e57ad0cb58d30e2992f22047b3c20377aa688ac",
        asm:
          "OP_DUP OP_HASH160 396b8e57ad0cb58d30e2992f22047b3c20377aa6 OP_EQUALVERIFY OP_CHECKSIG",
        addresses: ["mkkZf7T3fU3vHSzNPy51HBmM46ghN1gnN9"],
        type: "pubkeyhash"
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    },
    {
      value: "0.00000546",
      n: 2,
      scriptPubKey: {
        hex: "76a914aa099b067337dc20993bbfdb5c4f3c6867ba2c5b88ac",
        asm:
          "OP_DUP OP_HASH160 aa099b067337dc20993bbfdb5c4f3c6867ba2c5b OP_EQUALVERIFY OP_CHECKSIG",
        addresses: ["mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL"],
        type: "pubkeyhash"
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    },
    {
      value: "0.09996891",
      n: 3,
      scriptPubKey: {
        hex: "76a914aa099b067337dc20993bbfdb5c4f3c6867ba2c5b88ac",
        asm:
          "OP_DUP OP_HASH160 aa099b067337dc20993bbfdb5c4f3c6867ba2c5b OP_EQUALVERIFY OP_CHECKSIG",
        addresses: ["mw22g57T9YA7MZQQu5eBDKj3PKTdt99oDL"],
        type: "pubkeyhash"
      },
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    }
  ],
  blockhash: "000000000000ce978accc64a6bb567acf0c653c202309a0f8e220149bf0c6968",
  blockheight: 1287490,
  confirmations: 746,
  time: 1550855104,
  blocktime: 1550855104,
  valueOut: 0.09997983,
  size: 628,
  valueIn: 0.09998613,
  fees: 0.0000063,
  tokenInfo: {
    versionType: 1,
    transactionType: "SEND",
    tokenIdHex:
      "7ac7f4bb50b019fe0f5c81e3fc13fc0720e130282ea460768cafb49785eb2796",
    sendOutputs: ["0", "1230000000", "122170000000"]
  },
  tokenIsValid: true
}

const mockConvert = {
  slpAddress: "slptest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2shlcycvd5",
  cashAddress: "bchtest:qz35h5mfa8w2pqma2jq06lp7dnv5fxkp2svtllzmlf",
  legacyAddress: "mvQPGnzRT6gMWASZBMg7NcT3vmvsSKSQtf"
}

const mockTokenDetails = {
  tokenIdHex:
    "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb",
  documentUri: "",
  symbol: "NAKAMOTO",
  name: "NAKAMOTO",
  decimals: 8,
  timestamp: "",
  containsBaton: true,
  versionType: 1
}

const mockTokenStats = {
  qty_valid_txns_since_genesis: 241,
  qty_valid_token_utxos: 151,
  qty_valid_token_addresses: 113,
  qty_token_circulating_supply: "20995990",
  qty_token_burned: "4010",
  qty_token_minted: "21000000",
  qty_satoshis_locked_up: 81900
}

const mockBalance = {
  _id: "simpleledger:qp9d8mn8ypryfvea2mev0ggc3wg6plpn4suuaeuss3",
  token_balance: "1000"
}

const mockTransactions = [
  {
    txid: "a302f045be8efa1cd982833a7f187ff4fac8baac36da0c887eb2787d8b45e2af",
    tokenDetails: {
      valid: true,
      detail: {
        decimals: null,
        tokenIdHex:
          "495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a",
        timestamp: null,
        transactionType: "MINT",
        versionType: 1,
        documentUri: null,
        documentSha256Hex: null,
        symbol: null,
        name: null,
        batonVout: 2,
        containsBaton: true,
        genesisOrMintQuantity: {
          $numberDecimal: "1000"
        },
        sendOutputs: null
      },
      invalidReason: null,
      schema_version: 30
    }
  }
]

const mockFoobar = {
  c: [],
  u: []
}

const mockSingleValidTxid = {
  c: [
    {
      _id: "5d71e61e803baa0030b07231",
      tx: {
        h: "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091"
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

const mockTwoValidTxid = {
  c: [
    {
      _id: "5d71e61e803baa0030b07231",
      tx: {
        h: "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091"
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    },
    {
      _id: "5d71e614803baa0030b0722c",
      tx: {
        h: "82d996847a861b08b1601284ef7d40a1777d019154a6c4ed11571609dd3555ac"
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

const mockTwoRedundentTxid = {
  c: [
    {
      _id: "5d71e61e803baa0030b07231",
      tx: {
        h: "78d57a82a0dd9930cc17843d9d06677f267777dd6b25055bad0ae43f1b884091"
      },
      slp: {
        valid: true,
        invalidReason: null
      }
    }
  ],
  u: []
}

module.exports = {
  mockList,
  mockSingleToken,
  mockConvert,
  mockTokenDetails,
  mockTokenStats,
  mockTx,
  mockBalance,
  mockTransactions,
  mockSingleTokenError,
  mockSingleAddress,
  mockFoobar,
  mockSingleValidTxid,
  mockTwoValidTxid,
  mockTwoRedundentTxid
}
