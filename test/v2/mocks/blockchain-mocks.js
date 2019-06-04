/*
  This library contains mocking data for running unit tests on the address route.
*/

"use strict"

const mockBlockHash =
  "00000000000000645dec6503d3f5eafb0d2537a7a28f181d721dec7c44154c79"

const mockBlockchainInfo = {
  chain: "test",
  blocks: 1267694,
  headers: 1267694,
  bestblockhash:
    "000000000000013eaf80d1e157e32804c36a58ad0bb26ca59833880c80298780",
  difficulty: 4105763.969035785,
  mediantime: 1542131305,
  verificationprogress: 0.9999968911571566,
  chainwork: "00000000000000000000000000000000000000000000003f0443b0b5f02ce255",
  pruned: false,
  softforks: [
    { id: "bip34", version: 2, reject: { status: true } },
    { id: "bip66", version: 3, reject: { status: true } },
    { id: "bip65", version: 4, reject: { status: true } }
  ],
  bip9_softforks: {
    csv: {
      status: "active",
      startTime: 1456790400,
      timeout: 1493596800,
      since: 770112
    }
  }
}

const mockChainTips = [
  {
    height: 1267696,
    hash: "000000000000035bfc43a642ebbff8cfc1e88b1d564de8b0a6c7e2797eeafb21",
    branchlen: 0,
    status: "active"
  },
  {
    height: 1267581,
    hash: "000000000001bd12e4124207682563135b21353ca3087bc6b0c409f7f9e1da91",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1267375,
    hash: "00000000702036979df70236bcc45dfc72d43d5d0e6834007afa1fa627e49587",
    branchlen: 1036,
    status: "headers-only"
  },
  {
    height: 1266979,
    hash: "00000000e851abbde2174ccdc5c2508b909f81f23c4b7abeac864eee1a4891c7",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266973,
    hash: "000000007e1324d2900ed70947f89ab8fd4a267e87c9244c333215659a7370d5",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266967,
    hash: "000000000f37f12843d4800f50ec4de44dce0432e4d448242d43ff04a7a2948d",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266963,
    hash: "00000000ae11ec99e88898cbd72567cb4cb79e7fc13243357bef79632769deb4",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266962,
    hash: "000000004f97851259b4460a049e44fa5bd4beadee04a85bf81bd2e90c4f24f9",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266950,
    hash: "00000000d12a0e4a827f73ecaadb563df7e99817294939f2be8e943079dc60b2",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266944,
    hash: "00000000612d16af273217818e8e7ac5014a19f68ed04e1bc897b1be0a9c744f",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266941,
    hash: "0000000000002b91cdb15cacf3368da2c9ffce511d64092193b507dad75f4a27",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266896,
    hash: "000000000002745f67a66617b1f9f65c2dfb4c4b8a9ed9b1320b98d3ca46cbe5",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266481,
    hash: "0000000000036babee3ba7654cddb29a9fe5e85c9fbeb44bb53d5ffb694b9670",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266452,
    hash: "00000000502c3ab1490e0839780a4b441bbe21507c454545941e6adcde73c2ff",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1266336,
    hash: "000000001c9a0b7cd9eb2210f69d5a9a3f4546ba3707deb40993d729190582d7",
    branchlen: 10,
    status: "headers-only"
  },
  {
    height: 1266097,
    hash: "000000000028ac0fbd18afe6f001f70cb7549bd2b3082d754dde88ee236368a2",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1265522,
    hash: "00000000000000c6df7a2063030e6ce51399e470cc46e4bf6d67aa3f0feca98d",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1265470,
    hash: "0000000000168e6442a595a02340fccf8dc2b0e8912c632d39e1f870685f6d7c",
    branchlen: 2,
    status: "valid-fork"
  },
  {
    height: 1265275,
    hash: "000000008bc2b37ae6af1b886b52e7e1c1122c12badc4ae6c13df64f789267cf",
    branchlen: 11027,
    status: "headers-only"
  },
  {
    height: 1265257,
    hash: "00000000005bc3e9973d7273211eab02ae02549c7ebae48764c0bd648d4d7bbe",
    branchlen: 114,
    status: "valid-fork"
  },
  {
    height: 1265254,
    hash: "0000000000e5b909d3541857315e9ee103b042d9ba661f25cc3e8fb25a96c8ce",
    branchlen: 111,
    status: "valid-fork"
  },
  {
    height: 1265245,
    hash: "000000000066eb8832f6f990baceb379536f437216e22475a6c1b9133d250cb8",
    branchlen: 102,
    status: "valid-fork"
  },
  {
    height: 1264455,
    hash: "00000000000001befc1bb17a23208d0b77b2449e37093ce8fbb5e346b19cafcc",
    branchlen: 1,
    status: "valid-headers"
  },
  {
    height: 1264373,
    hash: "00000000000001ed3747e04fb95054cac0358fb4d8009d1999fc3ea34413e84a",
    branchlen: 175,
    status: "valid-fork"
  },
  {
    height: 1263912,
    hash: "00000000000004635aecbcb97edcd6f5396483338838cb40da804eb354c68bde",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1262906,
    hash: "00000000b31643d92a3e7c38e9755844fc8607e3f1055580a8ff28854e8a8ece",
    branchlen: 1,
    status: "valid-fork"
  },
  {
    height: 1255749,
    hash: "000000001dde5b015a99137f4cba87871370f4b6fcfbcc8b126547e6c33177da",
    branchlen: 129,
    status: "headers-only"
  },
  {
    height: 1188789,
    hash: "00000000af942ce4eb60b3213cbcb7c98a7330f1f8f1adb4b6376f5e822e15b2",
    branchlen: 92,
    status: "headers-only"
  }
]

const mockMempoolInfo = {
  size: 87,
  bytes: 16816,
  usage: 66408,
  maxmempool: 300000000,
  mempoolminfee: 0
}

const mockRawMempool = [
  "db045bc3bd1088fa91f5ebb05c35cb9e2a91a22377f79b465cc6920b9893123c",
  "6b3df7febf2b9834f1409155f88b866dd516b36376eae00e2b455df82e290405"
]

const mockBlockHeaderConcise =
  "0000ff7f7d217c9b7845ea8b50d620c59a1bf7c276566406e9b7bc7e463e0000000000006d70322c0b697c1c81d2744f87f09f1e9780ba5d30338952e2cdc64e60456f8423bb0a5ceafa091a3e843526"

const mockBlockHeader = {
  hash: "00000000000008c3679777df34f1a09565f98b2400a05b7c8da72525fdca3900",
  confirmations: 7,
  height: 1272859,
  version: 2147418112,
  versionHex: "7fff0000",
  merkleroot:
    "846f45604ec6cde2528933305dba80971e9ff0874f74d2811c7c690b2c32706d",
  time: 1544207139,
  mediantime: 1544202884,
  nonce: 641041470,
  bits: "1a09faea",
  difficulty: 1681035.704111868,
  chainwork: "00000000000000000000000000000000000000000000003fc4752e608403be04",
  previousblockhash:
    "0000000000003e467ebcb7e906645676c2f71b9ac520d6508bea45789b7c217d",
  nextblockhash:
    "00000000000006899041cdfd6c0b73a97730c362346dde479b77414ad7f25ace"
}

const mockTxOut = {
  bestblock: "00000000003a7f19730dd9f172d7466658a5c8833dd03ed8f4ba36e3d857b5e7",
  confirmations: 10,
  value: 0.0001,
  scriptPubKey: {
    asm:
      "OP_DUP OP_HASH160 0ee020c07f39526ac5505c54fa1ab98490979b83 OP_EQUALVERIFY OP_CHECKSIG",
    hex: "76a9140ee020c07f39526ac5505c54fa1ab98490979b8388ac",
    reqSigs: 1,
    type: "pubkeyhash",
    addresses: ["bchtest:qq8wqgxq0uu4y6k92pw9f7s6hxzfp9umsvtg39pzqf"]
  },
  coinbase: false
}

const mockTxOutProof =
  "000000200798039affceb7a381e15dc62443c286efe7cae852393b656807000000000000cf9a7d6c654fd1c4558229a619a550ff749b373fa0f0027eed68b1abf6175d5c07c50f5cffff001d0452403b34000000070d0765da76980d542b5670d27ccda9e717073270f8921ad017deb7ee83fe6c4c22830a48cc8392197f1742a3d81805bd2aa4eb7469f38c74f674429d682cb87efcff1713fd0c388a50f0d11adf05363397ef79d16cdb786d47c941c2cb89f2588f42aced9c05f4203b4440616a9e4266ec47909b9580a643f402b5d4e82cc3cddd73df05a33abf6af3975d973d3033d10c4168a73d58d01f685a96d5a2519cd0de9c77faf3f8725ddf155cbdc8ab8102f173e2d0a0d74767f3bff22f588158d6d5bc71c079c7659cc864819c43877635007650502eb4060fcc9feec3280a41d602ad0a"

module.exports = {
  mockBlockHash,
  mockBlockchainInfo,
  mockChainTips,
  mockMempoolInfo,
  mockRawMempool,
  mockBlockHeaderConcise,
  mockBlockHeader,
  mockTxOut,
  mockTxOutProof
}
