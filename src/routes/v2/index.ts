// imports
import * as express from "express"

// consts
const router: express.Router = express.Router()

router.get("/", root)
router.get("/v2", root)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  return res.render("swagger-v2")
}

export default router
