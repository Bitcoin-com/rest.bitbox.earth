/*
  This library contains mocking data for running unit tests on the address route.
*/

const mockGetInfo = {
  version: 170200,
  protocolversion: 70015,
  walletversion: 160300,
  balance: 0,
  blocks: 1266726,
  timeoffset: 0,
  connections: 8,
  proxy: "",
  difficulty: 1,
  testnet: true,
  keypoololdest: 1536331195,
  keypoolsize: 2000,
  paytxfee: 0,
  relayfee: 0.00001,
  errors: "Warning: unknown new rules activated (versionbit 28)"
}

mockGetNetworkInfo = {
  version: 190600,
  subversion: "/Bitcoin ABC:0.19.6(EB32.0)/",
  protocolversion: 70015,
  localservices: "0000000000000425",
  localrelay: true,
  timeoffset: 0,
  networkactive: true,
  connections: 18,
  networks: [{}, {}, {}],
  relayfee: 0.00001,
  excessutxocharge: 0,
  localaddresses: [],
  warnings:
    "Warning: Unknown block versions being mined! It's possible unknown rules are in effect"
}

module.exports = {
  mockGetInfo,
  mockGetNetworkInfo
}
