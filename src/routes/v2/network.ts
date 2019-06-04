// imports
import * as express from "express"

// consts
const router: express.Router = express.Router()
router.get("/", root)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "network" })
}

export default router
