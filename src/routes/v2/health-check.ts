// imports
import * as express from "express"

// consts
const router: express.Router = express.Router()

router.get("/", root)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "winning v2" })
}

export default router
