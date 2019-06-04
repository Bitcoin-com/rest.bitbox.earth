// imports
import * as express from "express"

// consts
const router: any = express.Router()
//const axios = require("axios");

//const BITBOXCli = require("bitbox-sdk/lib/bitbox-sdk").default;
//const BITBOX = new BITBOXCli();

//const BitboxHTTP = axios.create({
//  baseURL: process.env.RPC_BASEURL,
//});
//const username = process.env.RPC_USERNAME;
//const password = process.env.RPC_PASSWORD;

router.get("/", (req, res, next) => {
  res.json({ status: "generating" })
})
//
// router.post('/generateToAddress/:nblocks/:address', (req, res, next) => {
//   let maxtries = 1000000;
//   if(req.query.maxtries) {
//     maxtries = parseInt(req.query.maxtries);
//   }
//
//   BitboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"generatetoaddress",
//       method: "generatetoaddress",
//       params: [
//         req.params.nblocks,
//         req.params.address,
//         maxtries
//       ]
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });

export default router
