/*
  This library contains mocking data for running unit tests on the address route.
*/

"use strict"

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

module.exports = {
  mockGetInfo
}
