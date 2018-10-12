"use strict"

const express = require("express")
const router = express.Router()
const axios = require("axios")
const RateLimit = require("express-rate-limit")

//const BITBOXCli = require("bitbox-cli/lib/bitbox-cli").default;
//const BITBOX = new BITBOXCli();

const BitboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})
const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const config = {
  rawTransactionsRateLimit1: undefined,
  rawTransactionsRateLimit2: undefined,
  rawTransactionsRateLimit3: undefined,
  rawTransactionsRateLimit4: undefined,
  rawTransactionsRateLimit5: undefined,
  rawTransactionsRateLimit6: undefined,
  rawTransactionsRateLimit7: undefined,
  rawTransactionsRateLimit8: undefined,
  rawTransactionsRateLimit9: undefined,
  rawTransactionsRateLimit10: undefined,
  rawTransactionsRateLimit11: undefined
}

let i = 1

while (i < 12) {
  config[`rawTransactionsRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: function(req, res /*next*/) {
      res.format({
        json: function() {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

const requestConfig = {
  method: "post",
  auth: {
    username: username,
    password: password
  },
  data: {
    jsonrpc: "1.0"
  }
}

router.get("/", config.rawTransactionsRateLimit1, (req, res, next) => {
  res.json({ status: "rawtransactions" })
})

router.get(
  "/decodeRawTransaction/:hex",
  config.rawTransactionsRateLimit2,
  (req, res, next) => {
    try {
      let transactions = JSON.parse(req.params.hex)
      if (transactions.length > 20) {
        res.json({
          error: "Array too large. Max 20 transactions"
        })
      }
      const result = []
      transactions = transactions.map(transaction =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "decoderawtransaction",
            method: "decoderawtransaction",
            params: [transaction]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(transactions).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "decoderawtransaction",
          method: "decoderawtransaction",
          params: [req.params.hex]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/decodeScript/:script",
  config.rawTransactionsRateLimit3,
  (req, res, next) => {
    try {
      let scripts = JSON.parse(req.params.script)
      if (scripts.length > 20) {
        res.json({
          error: "Array too large. Max 20 scripts"
        })
      }
      const result = []
      scripts = scripts.map(script =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "decodescript",
            method: "decodescript",
            params: [script]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(scripts).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "decodescript",
          method: "decodescript",
          params: [req.params.script]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.get(
  "/getRawTransaction/:txid",
  config.rawTransactionsRateLimit4,
  (req, res, next) => {
    let verbose = false
    if (req.query.verbose && req.query.verbose === "true") verbose = true

    try {
      let txids = JSON.parse(req.params.txid)
      if (txids.length > 20) {
        res.json({
          error: "Array too large. Max 20 txids"
        })
      }
      const result = []
      txids = txids.map(txid =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "getrawtransaction",
            method: "getrawtransaction",
            params: [txid, verbose]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(txids).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "getrawtransaction",
          method: "getrawtransaction",
          params: [req.params.txid, verbose]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.post(
  "/sendRawTransaction",
  config.rawTransactionsRateLimit5,
  (req, res, next) => {
    try {
      let transactions = req.body.hex
      //Probably not necessary anymore?
      // if (transactions.length > 20) {
      //   res.json({
      //     error: "Array too large. Max 20 transactions"
      //   })
      // }

      const result = []
      transactions = transactions.map(transaction =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "sendrawtransaction",
            method: "sendrawtransaction",
            params: [transaction]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(transactions).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "sendrawtransaction",
          method: "sendrawtransaction",
          params: [req.body.hex]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.post(
  "/sendRawTransaction/:hex",
  config.rawTransactionsRateLimit5,
  (req, res, next) => {
    try {
      let transactions = JSON.parse(req.params.hex)
      if (transactions.length > 20) {
        res.json({
          error: "Array too large. Max 20 transactions"
        })
      }

      const result = []
      transactions = transactions.map(transaction =>
        BitboxHTTP({
          method: "post",
          auth: {
            username: username,
            password: password
          },
          data: {
            jsonrpc: "1.0",
            id: "sendrawtransaction",
            method: "sendrawtransaction",
            params: [transaction]
          }
        }).catch(error => {
          try {
            return {
              data: {
                result: error.response.data.error.message
              }
            }
          } catch (ex) {
            return {
              data: {
                result: "unknown error"
              }
            }
          }
        })
      )
      axios.all(transactions).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            const parsed = args[i].data.result
            result.push(parsed)
          }
          res.json(result)
        })
      )
    } catch (error) {
      BitboxHTTP({
        method: "post",
        auth: {
          username: username,
          password: password
        },
        data: {
          jsonrpc: "1.0",
          id: "sendrawtransaction",
          method: "sendrawtransaction",
          params: [req.params.hex]
        }
      })
        .then(response => {
          res.json(response.data.result)
        })
        .catch(error => {
          res.send(error.response.data.error.message)
        })
    }
  }
)

router.post(
  "/change",
  config.rawTransactionsRateLimit6,
  async (req, res, next) => {
    try {
      const params = [
        req.body.rawtx,
        req.body.prevTxs,
        req.body.destination,
        parseFloat(req.body.fee)
      ]
      if (req.query.position) params.push(parseInt(req.query.position))

      requestConfig.data.id = "whc_createrawtx_change"
      requestConfig.data.method = "whc_createrawtx_change"
      requestConfig.data.params = params

      try {
        const response = await BitboxHTTP(requestConfig)
        res.json(response.data.result)
      } catch (error) {
        res.status(500).send(error.response.data.error)
      }
    } catch (err) {
      console.log(`Error in /change: `)
      res.status(500)
      res.send(`Error in /change: ${err.message}`)
    }
  }
)

router.post(
  "/change/:rawtx/:prevTxs/:destination/:fee",
  config.rawTransactionsRateLimit6,
  async (req, res, next) => {
    try {
      const params = [
        req.params.rawtx,
        JSON.parse(req.params.prevTxs),
        req.params.destination,
        parseFloat(req.params.fee)
      ]
      if (req.query.position) params.push(parseInt(req.query.position))

      requestConfig.data.id = "whc_createrawtx_change"
      requestConfig.data.method = "whc_createrawtx_change"
      requestConfig.data.params = params

      try {
        const response = await BitboxHTTP(requestConfig)
        res.json(response.data.result)
      } catch (error) {
        res.status(500).send(error.response.data.error)
      }
    } catch (err) {
      console.log(`Error in /change: `)
      res.status(500)
      res.send(`Error in /change: ${err.message}`)
    }
  }
)

router.post(
  "/input",
  config.rawTransactionsRateLimit7,
  async (req, res, next) => {
    requestConfig.data.id = "whc_createrawtx_input"
    requestConfig.data.method = "whc_createrawtx_input"
    requestConfig.data.params = [
      req.body.rawtx,
      req.body.txid,
      parseInt(req.body.n)
    ]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/input/:rawTx/:txid/:n",
  config.rawTransactionsRateLimit7,
  async (req, res, next) => {
    requestConfig.data.id = "whc_createrawtx_input"
    requestConfig.data.method = "whc_createrawtx_input"
    requestConfig.data.params = [
      req.params.rawTx,
      req.params.txid,
      parseInt(req.params.n)
    ]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/opReturn",
  config.rawTransactionsRateLimit8,
  async (req, res, next) => {
    requestConfig.data.id = "whc_createrawtx_opreturn"
    requestConfig.data.method = "whc_createrawtx_opreturn"
    requestConfig.data.params = [req.body.rawtx, req.body.payload]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/opReturn/:rawTx/:payload",
  config.rawTransactionsRateLimit8,
  async (req, res, next) => {
    requestConfig.data.id = "whc_createrawtx_opreturn"
    requestConfig.data.method = "whc_createrawtx_opreturn"
    requestConfig.data.params = [req.params.rawTx, req.params.payload]

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/reference",
  config.rawTransactionsRateLimit9,
  async (req, res, next) => {
    const params = [req.body.rawtx, req.body.destination]
    if (req.query.amount) params.push(req.query.amount)

    requestConfig.data.id = "whc_createrawtx_reference"
    requestConfig.data.method = "whc_createrawtx_reference"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/reference/:rawTx/:destination",
  config.rawTransactionsRateLimit9,
  async (req, res, next) => {
    const params = [req.params.rawTx, req.params.destination]
    if (req.query.amount) params.push(req.query.amount)

    requestConfig.data.id = "whc_createrawtx_reference"
    requestConfig.data.method = "whc_createrawtx_reference"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error)
    }
  }
)

router.post(
  "/decodeTransaction/:rawTx",
  config.rawTransactionsRateLimit10,
  async (req, res, next) => {
    const params = [req.params.rawTx]
    if (req.query.prevTxs) params.push(JSON.parse(req.query.prevTxs))

    if (req.query.height) params.push(req.query.height)

    requestConfig.data.id = "whc_decodetransaction"
    requestConfig.data.method = "whc_decodetransaction"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error.message)
    }
  }
)

router.post(
  "/create",
  config.rawTransactionsRateLimit11,
  async (req, res, next) => {
    const params = [
      req.body.inputs,
      req.body.outputs
    ]
    if (req.query.locktime) params.push(req.query.locktime)

    requestConfig.data.id = "createrawtransaction"
    requestConfig.data.method = "createrawtransaction"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      console.log(error);
      res.status(500).send(error.response.data.error.message)
    }
  }
)

router.post(
  "/create/:inputs/:outputs",
  config.rawTransactionsRateLimit11,
  async (req, res, next) => {
    const params = [
      JSON.parse(req.params.inputs),
      JSON.parse(req.params.outputs)
    ]
    if (req.query.locktime) params.push(req.query.locktime)

    requestConfig.data.id = "createrawtransaction"
    requestConfig.data.method = "createrawtransaction"
    requestConfig.data.params = params

    try {
      const response = await BitboxHTTP(requestConfig)
      res.json(response.data.result)
    } catch (error) {
      res.status(500).send(error.response.data.error.message)
    }
  }
)

module.exports = router
