/*
  This library contains mocking data for running unit tests.
*/

const mockDecodeRawTransaction = {
  txid: "a332237d82a2543af1b0e1ae3c8cea1610c290ebcaf084a7e9894a61de0be988",
  hash: "a332237d82a2543af1b0e1ae3c8cea1610c290ebcaf084a7e9894a61de0be988",
  size: 226,
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: "21cced645eab150585ed7ca7c96edebab5793cc0a3b3b286c42fd7d6d798b5b9",
      vout: 1,
      scriptSig: {
        asm:
          "3045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd41390[ALL|FORKID] 0360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413d",
        hex:
          "483045022100a7b1b08956abb8d6f322aa709d8583c8ea492ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab4667c57b2786f51c413d"
      },
      sequence: 4294967295
    }
  ],
  vout: [
    {
      value: 0.0001,
      n: 0,
      scriptPubKey: {
        asm:
          "OP_DUP OP_HASH160 eb4b180def88e3f5625b2d8ae2c098ff7d85f664 OP_EQUALVERIFY OP_CHECKSIG",
        hex: "76a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac",
        reqSigs: 1,
        type: "pubkeyhash",
        addresses: [Array]
      }
    },
    {
      value: 0.09989752,
      n: 1,
      scriptPubKey: {
        asm:
          "OP_DUP OP_HASH160 eb4b180def88e3f5625b2d8ae2c098ff7d85f664 OP_EQUALVERIFY OP_CHECKSIG",
        hex: "76a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac",
        reqSigs: 1,
        type: "pubkeyhash",
        addresses: [Array]
      }
    }
  ]
}

const mockDecodeScript = {
  asm:
    "0 0 -57 OP_NOP6 OP_LSHIFT OP_UNKNOWN OP_UNKNOWN OP_UNKNOWN c486b2b3a3c03c79b5bade6ec9a77ced850515ab5e64edcc21010000006b483045022100a7b1b08956abb8d6f322aa OP_2OVER OP_NUMEQUALVERIFY OP_OR OP_INVERT OP_UNKNOWN OP_UNKNOWN 2ba0585f1a6f4f9983520af74a5a0220411aee4a9a54effab617b0508c504c31681b15f9b187179b4874257badd4139041210360cfc66fdacb650bc4c83b4e351805181ee696b7d5ab 67c57b2786f51c413dffffffff0210270000000000001976a914eb4b180def88e3f5625b2d8ae2c098ff7d85f66488ac786e9800000000001976a914eb4b180def88e3f5625b [error]",
  type: "nonstandard",
  p2sh: "bchtest:pzy6dwfy6yf373w0dr05a6flfqksurjhwcl3awhdvm"
}

const mockRawTransactionConcise =
  "02000000014e6b52500110b1c30315b85805fb274f0f4afceffc1589f889b27709e59e987d000000006a473044022052762770baa71c1a0b9544ad0f1ea343d32c22aa87c5f8397b6852f464c15b1e02201f4390745cb470e21e0e3c14229f39fef55ea0643a4c997f99d9f3501eae09b7412103c346eee77a77a8d3e073dacc0532ca7a5b9747bc06d88bf091cac9f4bc8bb792ffffffff02d1778f950a0000001976a91436d2f27bbd826a86db1e93618ce3de89ef33169388ac80969800000000001976a914152ea3cd65f18cb8fa9146c84ea1a97af8f051de88ac00000000"

const mockRawTransactionVerbose = {
  hex:
    "02000000014e6b52500110b1c30315b85805fb274f0f4afceffc1589f889b27709e59e987d000000006a473044022052762770baa71c1a0b9544ad0f1ea343d32c22aa87c5f8397b6852f464c15b1e02201f4390745cb470e21e0e3c14229f39fef55ea0643a4c997f99d9f3501eae09b7412103c346eee77a77a8d3e073dacc0532ca7a5b9747bc06d88bf091cac9f4bc8bb792ffffffff02d1778f950a0000001976a91436d2f27bbd826a86db1e93618ce3de89ef33169388ac80969800000000001976a914152ea3cd65f18cb8fa9146c84ea1a97af8f051de88ac00000000",
  txid: "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971",
  hash: "bd320377db7026a3dd5c7ec444596c0ee18fc25c4f34ee944adc03e432ce1971",
  size: 225,
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: "7d989ee50977b289f88915fceffc4a0f4f27fb0558b81503c3b1100150526b4e",
      vout: 0,
      scriptSig: {
        asm:
          "3044022052762770baa71c1a0b9544ad0f1ea343d32c22aa87c5f8397b6852f464c15b1e02201f4390745cb470e21e0e3c14229f39fef55ea0643a4c997f99d9f3501eae09b7[ALL|FORKID] 03c346eee77a77a8d3e073dacc0532ca7a5b9747bc06d88bf091cac9f4bc8bb792",
        hex:
          "473044022052762770baa71c1a0b9544ad0f1ea343d32c22aa87c5f8397b6852f464c15b1e02201f4390745cb470e21e0e3c14229f39fef55ea0643a4c997f99d9f3501eae09b7412103c346eee77a77a8d3e073dacc0532ca7a5b9747bc06d88bf091cac9f4bc8bb792"
      },
      sequence: 4294967295
    }
  ],
  vout: [
    {
      value: 454.58880465,
      n: 0,
      scriptPubKey: {
        asm:
          "OP_DUP OP_HASH160 36d2f27bbd826a86db1e93618ce3de89ef331693 OP_EQUALVERIFY OP_CHECKSIG",
        hex: "76a91436d2f27bbd826a86db1e93618ce3de89ef33169388ac",
        reqSigs: 1,
        type: "pubkeyhash",
        addresses: ["bchtest:qqmd9unmhkpx4pkmr6fkrr8rm6y77vckjvqe8aey35"]
      }
    },
    {
      value: 0.1,
      n: 1,
      scriptPubKey: {
        asm:
          "OP_DUP OP_HASH160 152ea3cd65f18cb8fa9146c84ea1a97af8f051de OP_EQUALVERIFY OP_CHECKSIG",
        hex: "76a914152ea3cd65f18cb8fa9146c84ea1a97af8f051de88ac",
        reqSigs: 1,
        type: "pubkeyhash",
        addresses: ["bchtest:qq2jag7dvhccew86j9rvsn4p49a03uz3mcpw3d6aca"]
      }
    }
  ],
  blockhash: "000000000000026fa244de975ca89ea08008aa566564ce2e8ebb3144361b601b",
  confirmations: 125,
  time: 1542646373,
  blocktime: 1542646373
}

const mockWHDecode = {
  txid: "f8a9857fe3b8a288b5fcafb1b0fc196731f433add6d962f77acd7c10b970ff89",
  fee: "500",
  sendingaddress: "bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr",
  referenceaddress: "bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr",
  ismine: false,
  version: 0,
  type_int: 0,
  type: "Simple Send",
  propertyid: 368,
  precision: "8",
  amount: "10.00000000",
  valid: true,
  blockhash: "0000000046ba0bcef78caaa4492622176bbc563cf249ab52340a0449bc8e26f6",
  blocktime: 1542814183,
  positioninblock: 57,
  block: 1269008,
  confirmations: 2
}

const mockWHCreateInput = {
  txid: "f7ed9cf23dee85910f6269c9a101a75fcfd2f3c6fc81f17fad824ff7aaf99ab2",
  vout: 1,
  scriptPubKey: "76a914a4b98b0c118de83e7d39c834445f51dce62425f588ac",
  amount: 0.09984138,
  satoshis: 9984138,
  height: 1269011,
  confirmations: 4,
  legacyAddress: "mvXwPH74hW2yVTWwDwzsjGoaUAqJvWk7ZJ",
  cashAddress: "bchtest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr",
  value: 0.09984138
}

module.exports = {
  mockDecodeRawTransaction,
  mockDecodeScript,
  mockRawTransactionConcise,
  mockRawTransactionVerbose,
  mockWHDecode,
  mockWHCreateInput
}
