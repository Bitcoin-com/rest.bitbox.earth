/*
  This library contains mocking data for running unit tests on the address route.
*/

const mockBlockDetails = {
  hash: "00000000000000645dec6503d3f5eafb0d2537a7a28f181d721dec7c44154c79",
  size: 1319,
  height: 1267544,
  version: 536870912,
  merkleroot:
    "c2cd01ec2cf149acc7631385f89ae103d1a2ad212ab810c862d9680a811618ce",
  tx: [
    "52bfa89d449fef8070ec33e7a61f5ec8b5417ff62b050cd6a144ebce9557e0fa",
    "8988e8742d2523f667c2d1374861919e3a82903e059fec75c10795da2303b93b",
    "41def004f22b196d675566a6983ecf97611e72c48375b8ba779983d5ccd369d7",
    "8ca8efb06abb94395f8331f87e101504dcf66aee828f2111922f056971fa7502",
    "9ab409cbb203be7cf22bd6598d787fcdd5b417d885b72207ecc7253470770649"
  ],
  time: 1542048973,
  nonce: 3936284753,
  bits: "1a03c148",
  difficulty: 4467892.99177529,
  chainwork: "00000000000000000000000000000000000000000000003ee27b503a064045bd",
  confirmations: 3,
  previousblockhash:
    "00000000000001891202cbe18729a02a8763cf04da0ca7aded6e6c7d9b500785",
  nextblockhash:
    "000000000000039b93b3f3403a0eb21150904b15229d998cf3788fd8bf192cc2",
  reward: 0.78125,
  isMainChain: true,
  poolInfo: {}
}

const mockBlockHash =
  "00000000000000645dec6503d3f5eafb0d2537a7a28f181d721dec7c44154c79"

module.exports = {
  mockBlockDetails,
  mockBlockHash
}
