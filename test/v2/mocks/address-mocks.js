/*
  This library contains mocking data for running unit tests on the address route.
*/

"use strict"

const mockAddressDetails = {
  addrStr: "1Fg4r9iDrEkCcDmHTy2T79EusNfhyQpu7W",
  balance: 0.00126419,
  balanceSat: 126419,
  totalReceived: 0.02175868,
  totalReceivedSat: 2175868,
  totalSent: 0.02049449,
  totalSentSat: 2049449,
  unconfirmedBalance: 0,
  unconfirmedBalanceSat: 0,
  unconfirmedTxApperances: 0,
  txApperances: 3,
  transactions: [
    "2dc053f55a666a3d2a08b1c680b704d62a55506d14ad884add87edcc56b9277d",
    "544c15ce35c0f2e808d28f29d6587f1ec9276233e29856b7f2938cf0daef0026",
    "81039b1d7b855b133f359f9dc65f776bd105650153a941675fedc504228ddbd3"
  ],
  legacyAddress: "1Fg4r9iDrEkCcDmHTy2T79EusNfhyQpu7W",
  cashAddress: "bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c"
}

const mockUtxoDetails = [
  {
    txid: "15f6a584080b04911121fbaca7bfcf3dd64ef2bfa5a01daf31e05a296c3e5e9e",
    vout: 286,
    amount: 0.00001,
    satoshis: 1000,
    height: 546083,
    confirmations: 3490
  },
  {
    txid: "15f6a584080b04911121fbaca7bfcf3dd64ef2bfa5a01daf31e05a296c3e5e9e",
    vout: 287,
    amount: 0.00001,
    satoshis: 1000,
    height: 546083,
    confirmations: 3490
  },
  {
    txid: "15f6a584080b04911121fbaca7bfcf3dd64ef2bfa5a01daf31e05a296c3e5e9e",
    vout: 288,
    amount: 0.00001,
    satoshis: 1000,
    height: 546083,
    confirmations: 3490
  }
]

const mockUnconfirmed = [
  {
    address: "1EzdL6TBbkNhnB2fYiBaKmcs5fxaoqwdAp",
    txid: "000c00a90fb5031da6e02f7625df2f8b35a4c16e6feb9fc72293e67e5ff75786",
    vout: 0,
    scriptPubKey: "76a914997fabcd94a1e2aaa13a7664362e5e7b96c169a988ac",
    amount: 0.00999626,
    satoshis: 999626,
    confirmations: 0,
    ts: 1537989425
  }
]

const mockTransactions = {
  pagesTotal: 1,
  txs: [
    {
      txid: "000c00a90fb5031da6e02f7625df2f8b35a4c16e6feb9fc72293e67e5ff75786",
      version: 2,
      locktime: 549565,
      vin: [
        {
          txid:
            "45c891c6d44619fc85716ba1b593aa83ebc1e500fe611b1ab98531ea203a0f21",
          vout: 209,
          sequence: 4294967294,
          n: 0,
          scriptSig: {
            hex:
              "47304402205b136f348bedae61a87c0500979d47ab02c76f0e4aba866b94c4931fccb5d7dc0220757a141660475b0cd4cb8b1f54b1ace95105f5bea775e817b115fb589fe4477541210246daec651c506f353daa7468714399c773df42ac4d663022d0e446a3331ac64a",
            asm:
              "304402205b136f348bedae61a87c0500979d47ab02c76f0e4aba866b94c4931fccb5d7dc0220757a141660475b0cd4cb8b1f54b1ace95105f5bea775e817b115fb589fe44775[ALL|FORKID] 0246daec651c506f353daa7468714399c773df42ac4d663022d0e446a3331ac64a"
          },
          addr: "14TdovsQUL69xL5g3zSzhLpmDb93d9rU9m",
          valueSat: 1979534,
          value: 0.01979534,
          doubleSpentTxID: null
        },
        {
          txid:
            "6e5fa79547112a912adf6082c975dc80e282045193512ea369adb6bac7420674",
          vout: 147,
          sequence: 4294967294,
          n: 1,
          scriptSig: {
            hex:
              "473044022056674ac83a37d54ffec2c6d33cfc2ae2256f821b8bd818e1b6783356b49f3d28022046d3dd147c8fc51f2da5d16996a3cea1d7314e327aa1ae1017418737ed20136a4121038f23af565f68d8455e07e5c33c5cfc5114de2f478f035db23eb02f8ff5fe7f6e",
            asm:
              "3044022056674ac83a37d54ffec2c6d33cfc2ae2256f821b8bd818e1b6783356b49f3d28022046d3dd147c8fc51f2da5d16996a3cea1d7314e327aa1ae1017418737ed20136a[ALL|FORKID] 038f23af565f68d8455e07e5c33c5cfc5114de2f478f035db23eb02f8ff5fe7f6e"
          },
          addr: "1CEtC2fjELvmAzTd6MWuHb1gvuSq8x3Xpb",
          valueSat: 10466,
          value: 0.00010466,
          doubleSpentTxID: null
        }
      ],
      vout: [
        {
          value: "0.00999626",
          n: 0,
          scriptPubKey: {
            hex: "76a914997fabcd94a1e2aaa13a7664362e5e7b96c169a988ac",
            asm:
              "OP_DUP OP_HASH160 997fabcd94a1e2aaa13a7664362e5e7b96c169a9 OP_EQUALVERIFY OP_CHECKSIG",
            addresses: ["1EzdL6TBbkNhnB2fYiBaKmcs5fxaoqwdAp"],
            type: "pubkeyhash"
          },
          spentTxId: null,
          spentIndex: null,
          spentHeight: null
        },
        {
          value: "0.00990000",
          n: 1,
          scriptPubKey: {
            hex: "76a914e3335e4d6babe61ea58311293c1c6bfe802801cb88ac",
            asm:
              "OP_DUP OP_HASH160 e3335e4d6babe61ea58311293c1c6bfe802801cb OP_EQUALVERIFY OP_CHECKSIG",
            addresses: ["1MiKvgaQTFCTEZbSDMZgw9ahaB52Cr4ofb"],
            type: "pubkeyhash"
          },
          spentTxId: null,
          spentIndex: null,
          spentHeight: null
        }
      ],
      blockhash:
        "00000000000000000158b1a2883688873ec5ea076e3b0f576bcdfe1fd277880f",
      blockheight: 549601,
      confirmations: 5,
      time: 1537990026,
      blocktime: 1537990026,
      valueOut: 0.01989626,
      size: 372,
      valueIn: 0.0199,
      fees: 0.00000374
    }
  ]
}

module.exports = {
  mockAddressDetails,
  mockUtxoDetails,
  mockUnconfirmed,
  mockTransactions
}
