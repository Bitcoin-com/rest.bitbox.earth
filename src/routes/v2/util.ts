// imports
import axios, { AxiosResponse } from "axios"
import { BITBOX } from "bitbox-sdk"
import * as express from "express"
import { wlogger } from "../../util/winston-logging"
import { ValidateAddressInterface } from "./interfaces/RESTInterfaces"
import { debug } from "./logging"
import {
  decodeError,
  setEnvVars,
  validateArraySize,
  validateNetwork
} from "./route-utils"

// consts
const router: any = express.Router()
const bitbox = new BITBOX()

// Used to convert error messages to strings, to safely pass to users.
const util: any = require("util")
util.inspect.defaultOptions = { depth: 1 }

router.get("/", root)
router.get("/validateAddress/:address", validateAddressSingle)
router.post("/validateAddress", validateAddressBulk)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "util" })
}

async function validateAddressSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const address: string = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const { BitboxHTTP, requestConfig } = setEnvVars()

    requestConfig.data.id = "validateaddress"
    requestConfig.data.method = "validateaddress"
    requestConfig.data.params = [address]

    const response: any = await BitboxHTTP(requestConfig)
    const validateAddress: ValidateAddressInterface = response.data.result

    return res.json(validateAddress)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in util.ts/validateAddressSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function validateAddressBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let addresses: string[] = req.body.addresses

    // Reject if addresses is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: "addresses needs to be an array. Use GET for single address."
      })
    }

    // Enforce array size rate limits
    if (!validateArraySize(req, addresses)) {
      res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
      return res.json({
        error: `Array too large.`
      })
    }

    // Validate each element in the array.
    for (let i: number = 0; i < addresses.length; i++) {
      const address: string = addresses[i]

      // Ensure the input is a valid BCH address.
      try {
        bitbox.Address.toLegacyAddress(address)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid BCH address. Double check your address is valid: ${address}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid: boolean = validateNetwork(address)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }
    }

    debug(`Executing util/validate with these addresses: `, addresses)

    // Loop through each address and creates an array of requests to call in parallel
    const promises: Promise<ValidateAddressInterface>[] = addresses.map(
      async (address: string): Promise<ValidateAddressInterface> => {
        const { BitboxHTTP, requestConfig } = setEnvVars()

        requestConfig.data.id = "validateaddress"
        requestConfig.data.method = "validateaddress"
        requestConfig.data.params = [address]

        return await BitboxHTTP(requestConfig)
      }
    )

    // Wait for all parallel Insight requests to return.
    const axiosResult: any[] = await axios.all(promises)

    // Retrieve the data part of the result.
    const result: ValidateAddressInterface[] = axiosResult.map(
      (x: AxiosResponse) => x.data.result
    )

    res.status(200)
    return res.json(result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in util.ts/validateAddressSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

export default {
  router,
  testableComponents: {
    root,
    validateAddressSingle,
    validateAddressBulk
  }
}
