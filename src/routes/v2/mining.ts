// imports
import { AxiosResponse } from "axios"
import * as express from "express"
import * as util from "util"
import { wlogger } from "../../util/winston-logging"
import {
  iDecodeError,
  iSetEnvVars,
  MiningInfoInterface
} from "./interfaces/RESTInterfaces"
import routeUtils = require("./route-utils")

// consts
const router: express.Router = express.Router()
// Used to convert error messages to strings, to safely pass to users.
util.inspect.defaultOptions = { depth: 1 }

router.get("/", root)
router.get("/getMiningInfo", getMiningInfo)
router.get("/getNetworkHashps", getNetworkHashPS)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "mining" })
}

async function getMiningInfo(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const { BitboxHTTP, requestConfig }: iSetEnvVars = routeUtils.setEnvVars()

    requestConfig.data.id = "getmininginfo"
    requestConfig.data.method = "getmininginfo"
    requestConfig.data.params = []

    const response: AxiosResponse = await BitboxHTTP(requestConfig)
    const miningInfoInterface: MiningInfoInterface = response.data.result

    return res.json(miningInfoInterface)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status }: iDecodeError = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in mining.ts/getMiningInfo().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function getNetworkHashPS(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let nblocks: number = 120 // Default
    let height: number = -1 // Default
    if (req.query.nblocks) nblocks = parseInt(req.query.nblocks)
    if (req.query.height) height = parseInt(req.query.height)

    const { BitboxHTTP, requestConfig }: iSetEnvVars = routeUtils.setEnvVars()

    requestConfig.data.id = "getnetworkhashps"
    requestConfig.data.method = "getnetworkhashps"
    requestConfig.data.params = [nblocks, height]

    const response: AxiosResponse = await BitboxHTTP(requestConfig)
    const networkHashPS: number = response.data.result

    return res.json(networkHashPS)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status }: iDecodeError = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in mining.ts/getNetworkHashPS().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

export default {
  router,
  testableComponents: {
    root,
    getMiningInfo,
    getNetworkHashPS
  }
}
