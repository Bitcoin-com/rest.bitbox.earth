// imports
import * as cashAccountClass from "cashaccounts"
import * as express from "express"
import * as util from "util"
import { wlogger } from "../../util/winston-logging"
import { CashAccountInterface } from "./interfaces/RESTInterfaces"
import { decodeError } from "./route-utils"

// consts
const router: express.Router = express.Router()
const cashAccounts: cashAccountClass = new cashAccountClass(
  process.env.CASHACCOUNT_LOOKUPSERVER
)
const SLPSDK: any = require("slp-sdk")
const SLP: any = new SLPSDK()
const slp: any = SLP.slpjs
const utils: any = slp.Utils

// Used for processing error messages before sending them to the user.
util.inspect.defaultOptions = { depth: 1 }

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/lookup/:account/:number/:collision?", lookup)
// router.post("/registration", registration)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "cashaccount" })
}

/**
 * Form Handle
 *
 * @param {string} account
 * @param {string} number
 * @param {string} collision
 * @returns Jonathan#100.123 // if collision supplied
 */
function formHandle(account: string, number: string, collision: string) {
  const handle = `${account}#${number}${
    collision !== undefined ? "." + collision : ""
  }`
  return handle
}

/**
 *  Check if valid cashaccount
 *
 * @param {string} handle
 * @returns {boolean}
 */
function isCashAccount(handle: string) {
  return cashAccounts.isCashAccount(handle)
}

/**
 *  CashAccount Lookup
 *
 * @param {string} account - Jonathan
 * @param {string} number - 100
 * @param {string} collision - optional
 * @returns {object} - CashAccountInterface
 */
async function lookup(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const {
      account,
      number,
      collision
    }: { account: string; number: string; collision: string } = req.params

    const handle: string = formHandle(account, number, collision)
    const valid: boolean = isCashAccount(handle)

    if (!valid) {
      return res.status(500).json({ error: "Not a valid CashAccount" })
    }

    let lookup: CashAccountInterface = await cashAccounts.trustedLookup(handle)
    if (lookup === undefined) {
      return res.status(500).json({
        error: "No account could be found with the requested parameters."
      })
    }

    // Return the retrieved address information.
    res.status(200)
    return res.json(lookup)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    wlogger.error(`Error in cashaccounts.ts/lookup().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 *  CashAccount Registration
 *
 * @param {string} username - Jonathan
 * @param {string} bchAddress - bitcoincash:asdf
 * @param {string} slpAddress - simpleledger:asdf
 * @returns {object} - CashAccountRegistration
 */
// async function registration(
//   req: express.Request,
//   res: express.Response,
//   next: express.NextFunction
// ): Promise<express.Response> {
//   try {
//     const {
//       username,
//       cashAddress,
//       slpAddress
//     }: {
//       username: string
//       cashAddress: string
//       slpAddress: string
//     } = req.body

//     if (username === undefined) {
//       res.status(400)
//       return res.json({
//         error: `Missing username.`
//       })
//     }

//     if (cashAddress === undefined) {
//       res.status(400)
//       return res.json({
//         error: `Missing BCH address.`
//       })
//     }

//     // Ensure the input is a valid BCH address.
//     try {
//       utils.toCashAddress(cashAddress)
//     } catch (err) {
//       res.status(400)
//       return res.json({
//         error: `Invalid BCH address. Double check your address is valid: ${cashAddress}`
//       })
//     }

//     // Ensure the input is a valid SLP address.
//     try {
//       utils.toSlpAddress(slpAddress)
//     } catch (err) {
//       res.status(400)
//       return res.json({
//         error: `Invalid SLP address. Double check your address is valid: ${slpAddress}`
//       })
//     }

//     const cashAccountRegex: RegExp = /^([a-zA-Z0-9_]{2,99})?$/i
//     const valid: boolean = cashAccountRegex.test(username)

//     if (!valid) {
//       return res.status(500).json({ error: "Invalid characters" })
//     }

//     let txid: CashAccountRegistration = await cashAccounts.trustedRegistration(
//       username,
//       cashAddress,
//       slpAddress
//     )

//     res.status(200)
//     return res.json(txid)
//   } catch (err) {
//     // Attempt to decode the error message.
//     const { msg, status } = decodeError(err)
//     if (msg) {
//       res.status(status)
//       return res.json({ error: msg })
//     }

//     wlogger.error(`Error in cashaccounts.ts/registration().`, err)

//     res.status(500)
//     return res.json({ error: util.inspect(err) })
//   }
// }

export default {
  router,
  lookupableComponents: {
    root,
    lookup
  }
}
