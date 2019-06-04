// imports
import { AxiosResponse } from "axios"
import * as express from "express"
import { InfoInterface } from "./interfaces/RESTInterfaces"
import routeUtils = require("./route-utils")
import wlogger = require("../../util/winston-logging")

// consts
const router: express.Router = express.Router()
// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

router.get("/", root)
router.get("/getInfo", getInfo)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "control" })
}

// Execute the RPC getinfo call.
async function getInfo(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  const { BitboxHTTP, requestConfig } = routeUtils.setEnvVars()

  requestConfig.data.id = "getinfo"
  requestConfig.data.method = "getinfo"
  requestConfig.data.params = []

  try {
    const response: AxiosResponse = await BitboxHTTP(requestConfig)
    const info: InfoInterface = response.data.result

    return res.json(info)
  } catch (error) {
    wlogger.error(`Error in control.ts/getInfo().`, error)

    // Write out error to error log.
    //logger.error(`Error in control/getInfo: `, error)

    res.status(500)
    if (error.response && error.response.data && error.response.data.error)
      return res.json({ error: error.response.data.error })
    return res.json({ error: util.inspect(error) })
  }
}

// router.get('/getMemoryInfo', (req, res, next) => {
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getmemoryinfo",
//       method: "getmemoryinfo"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.get('/help', (req, res, next) => {
//   BITBOX.Control.help()
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.post('/stop', (req, res, next) => {
//   BITBOX.Control.stop()
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });

export default {
  router,
  testableComponents: {
    root,
    getInfo
  }
}
