/*
  This library contains mocking data for running unit tests on the address route.
*/

const mockMiningInfo = {
  blocks: 1270185,
  currentblocksize: 0,
  currentblocktx: 0,
  difficulty: 1,
  blockprioritypercentage: 5,
  warnings:
    "Warning: Unknown block versions being mined! It's possible unknown rules are in effect",
  networkhashps: 517410290.9365583,
  pooledtx: 5,
  chain: "test"
}

module.exports = {
  mockMiningInfo
}
