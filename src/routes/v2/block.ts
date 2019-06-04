// imports
import axios, { AxiosPromise, AxiosResponse } from "axios"
import * as express from "express"
import { wlogger } from "../../util/winston-logging"
import { BlockInterface } from "./interfaces/RESTInterfaces"
import { decodeError, setEnvVars, validateArraySize } from "./route-utils"

// consts
const logger: any = require("./logging.js")

// Used for processing error messages before sending them to the user.
const util: any = require("util")
util.inspect.defaultOptions = { depth: 3 }

const router: express.Router = express.Router()
//const BitboxHTTP = bitbox.getInstance()

router.get("/", root)
router.get("/detailsByHash/:hash", detailsByHashSingle)
router.post("/detailsByHash", detailsByHashBulk)
router.get("/detailsByHeight/:height", detailsByHeightSingle)
router.post("/detailsByHeight", detailsByHeightBulk)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "block" })
}

// Call the insight server to get block details based on the hash.
async function detailsByHashSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const hash: string = req.params.hash

    // Reject if hash is empty
    if (!hash || hash === "") {
      res.status(400)
      return res.json({ error: "hash must not be empty" })
    }

    const response: AxiosResponse = await axios.get(
      `${process.env.BITCOINCOM_BASEURL}block/${hash}`
    )
    //console.log(`response.data: ${JSON.stringify(response.data,null,2)}`)

    const parsed: BlockInterface = response.data
    return res.json(parsed)
  } catch (error) {
    //console.log(`error object: ${util.inspect(error)}`)

    // Attempt to decode the error message.
    const { msg, status } = decodeError(error)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    if (error.response && error.response.status === 404) {
      res.status(404)
      return res.json({ error: "Not Found" })
    }

    // Write out error to error log.
    //logger.error(`Error in block/detailsByHash: `, error)
    wlogger.error(`Error in block.ts/detailsByHashSingle().`, error)

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

async function detailsByHashBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const hashes: string[] = req.body.hashes

    // Reject if hashes is not an array.
    if (!Array.isArray(hashes)) {
      res.status(400)
      return res.json({
        error: "hashes needs to be an array. Use GET for single address."
      })
    }

    // Enforce array size rate limits
    if (!validateArraySize(req, hashes)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each hash in the array.
    for (let i: number = 0; i < hashes.length; i++) {
      const thisHash: string = hashes[i]

      if (thisHash.length !== 64) {
        res.status(400)
        return res.json({
          error: `Invalid hash. Double check your hash is valid: ${thisHash}`
        })
      }
    }

    // Loop through each hash and creates an array of promises
    const axiosPromises: AxiosPromise<BlockInterface>[] = hashes.map(
      async (hash: string): Promise<any> => {
        return axios.get(`${process.env.BITCOINCOM_BASEURL}block/${hash}`)
      }
    )

    // Wait for all parallel promises to return.
    const axiosResult: AxiosResponse<BlockInterface>[] = await axios.all(
      axiosPromises
    )

    // Extract the data component from the axios response.
    const result: BlockInterface[] = axiosResult.map(
      (x: AxiosResponse) => x.data
    )
    //console.log(`result: ${util.inspect(result)}`)

    res.status(200)
    return res.json(result)
  } catch (error) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(error)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    if (error.response && error.response.status === 404) {
      res.status(404)
      return res.json({ error: "Not Found" })
    }

    // Write out error to error log.
    //logger.error(`Error in block/detailsByHash: `, error)
    wlogger.error(`Error in block.ts/detailsByHashBulk().`, error)

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

// Call the Full Node to get block hash based on height, then call the Insight
// server to get details from that hash.
async function detailsByHeightSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const height: string = req.params.height

    // Reject if id is empty
    if (!height || height === "") {
      res.status(400)
      return res.json({ error: "height must not be empty" })
    }

    const { BitboxHTTP, requestConfig } = setEnvVars()

    requestConfig.data.id = "getblockhash"
    requestConfig.data.method = "getblockhash"
    requestConfig.data.params = [parseInt(height)]

    const response: AxiosResponse = await BitboxHTTP(requestConfig)

    const hash: string = response.data.result
    //console.log(`response.data: ${util.inspect(response.data)}`)

    // Call detailsByHashSingle now that the hash has been retrieved.
    req.params.hash = hash
    return detailsByHashSingle(req, res, next)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in control/getInfo: `, error)
    wlogger.error(`Error in block.ts/detailsByHeightSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function detailsByHeightBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let heights: string[] = req.body.heights

    // Reject if heights is not an array.
    if (!Array.isArray(heights)) {
      res.status(400)
      return res.json({
        error: "heights needs to be an array. Use GET for single height."
      })
    }

    // Enforce array size rate limits
    if (!validateArraySize(req, heights)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    logger.debug(`Executing detailsByHeight with these heights: `, heights)

    // Validate each element in the address array.
    for (let i: number = 0; i < heights.length; i++) {
      const thisHeight: string = heights[i]

      // Reject if id is empty
      if (!thisHeight || thisHeight === "") {
        res.status(400)
        return res.json({ error: "height must not be empty" })
      }
    }

    // Loop through each height and creates an array of requests to call in parallel
    const promises: Promise<BlockInterface>[] = heights.map(
      async (height: string): Promise<BlockInterface> => {
        const { BitboxHTTP, requestConfig } = setEnvVars()
        requestConfig.data.id = "getblockhash"
        requestConfig.data.method = "getblockhash"
        requestConfig.data.params = [parseInt(height)]

        const response: AxiosResponse = await BitboxHTTP(requestConfig)

        const hash: string = response.data.result

        const axiosResult: AxiosResponse = await axios.get(
          `${process.env.BITCOINCOM_BASEURL}block/${hash}`
        )

        return axiosResult.data
      }
    )

    // Wait for all parallel Insight requests to return.
    let result: BlockInterface[] = await axios.all(promises)

    res.status(200)
    return res.json(result)
  } catch (error) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(error)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    if (error.response && error.response.status === 404) {
      res.status(404)
      return res.json({ error: "Not Found" })
    }

    // Write out error to error log.
    //logger.error(`Error in block/detailsByHash: `, error)
    wlogger.error(`Error in block.ts/detailsByHeightBulk().`, error)

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

export default {
  router,
  testableComponents: {
    root,
    detailsByHashSingle,
    detailsByHashBulk,
    detailsByHeightSingle,
    detailsByHeightBulk
  }
}
