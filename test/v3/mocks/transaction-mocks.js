/*
  This library contains mocking data for running unit tests on the address route.
*/

/*
const mockDetails = {
  txid: "6f235bd3a689f03c11969cd649ccad592462ca958bc519a30194e7a67b349a40",
  version: 2,
  locktime: 0,
  vin: [Array],
  vout: [Array],
  blockhash: "00000000e7232ff12462dedf9c11985f5b54202515277c337ccc59812758f28b",
  blockheight: 1270188,
  confirmations: 2,
  time: 1543436253,
  blocktime: 1543436253,
  valueOut: 450.78867333,
  size: 226,
  valueIn: 450.78867559,
  fees: 0.00000226
}
*/

const mockDetails = {
  txid: "6f235bd3a689f03c11969cd649ccad592462ca958bc519a30194e7a67b349a40",
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: "273d616d1c48f4b075c497f36ffdc79da5c8d6ed75485808b3599aac504f8525",
      vout: 0,
      sequence: 4294967295,
      n: 0,
      scriptSig: [{}],
      addr: "bchtest:qqmd9unmhkpx4pkmr6fkrr8rm6y77vckjvqe8aey35",
      valueSat: 45078867559,
      value: 450.78867559,
      doubleSpentTxID: null
    }
  ],
  vout: [
    {
      value: "450.68867333",
      n: 0,
      scriptPubKey: [{}],
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    },
    {
      value: "0.10000000",
      n: 1,
      scriptPubKey: [{}],
      spentTxId: null,
      spentIndex: null,
      spentHeight: null
    }
  ],
  blockhash: "00000000e7232ff12462dedf9c11985f5b54202515277c337ccc59812758f28b",
  blockheight: 1270188,
  confirmations: 3,
  time: 1543436253,
  blocktime: 1543436253,
  valueOut: 450.78867333,
  size: 226,
  valueIn: 450.78867559,
  fees: 0.00000226
}

module.exports = {
  mockDetails
}
