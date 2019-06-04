// imports
import * as express from "express"

// consts
const router: express.Router = express.Router()

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ status: "winning v2" })
})

export default router
