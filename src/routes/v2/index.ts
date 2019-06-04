// imports
import * as express from "express"

// consts
const router: express.Router = express.Router()

/* GET home page. */
router.get(
  "/",
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    res.render("swagger-v2")
  }
)

router.get(
  "/v2",
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    res.render("swagger-v2")
  }
)

export default router
