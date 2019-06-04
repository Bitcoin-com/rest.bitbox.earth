/*
  This file controls the request-per-minute (RPM) rate limits.

  It is assumed that this middleware is run AFTER the auth.js middleware which
  checks for Basic auth. If the user adds the correct Basic auth to the header
  of their API request, they will get pro-tier rate limits. By default, the
  freemium rate limits apply.
*/

import * as express from "express"
const RateLimit = require("express-rate-limit")

// Set max requests per minute
const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 60

// Pro-tier rate limits are 10x the freemium limits.
const PRO_RPM = 10 * maxRequests

// Unique route mapped to its rate limit
const uniqueRateLimits: any = {}

// Add the 'locals' property to the express.Request interface.
declare global {
  namespace Express {
    interface Request {
      locals: any
    }
  }
}

export const routeRateLimit = function(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // Create a res.locals object if not passed in.
  if (!req.locals) req.locals = {}

  // Disable rate limiting if 0 passed from RATE_LIMIT_MAX_REQUESTS
  if (maxRequests === 0) return next()

  // Current route
  const rateLimitTier = req.locals.proLimit ? "PRO" : "BASIC"
  const path = req.baseUrl + req.path
  const route =
    rateLimitTier +
    req.method +
    path
      .split("/")
      .slice(0, 4)
      .join("/")

  // This boolean value is passed from the auth.js middleware.
  const proRateLimits = req.locals.proLimit

  // Pro level rate limits
  if (proRateLimits) {
    // TODO: replace the console.logs with calls to our logging system.
    //console.log(`applying pro-rate limits`)

    // Create new RateLimit if none exists for this route
    if (!uniqueRateLimits[route]) {
      uniqueRateLimits[route] = new RateLimit({
        windowMs: 60 * 1000, // 1 minute window
        delayMs: 0, // disable delaying - full speed until the max limit is reached
        max: PRO_RPM, // start blocking after this many requests per minute
        handler: function(
          req: express.Request,
          res: express.Response /*next*/
        ) {
          //console.log(`pro-tier rate-handler triggered.`)

          res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
          return res.json({
            error: `Too many requests. Limits are ${PRO_RPM} requests per minute.`
          })
        }
      })
    }

    // Freemium level rate limits
  } else {
    // TODO: replace the console.logs with calls to our logging system.
    //console.log(`applying freemium limits`)

    // Create new RateLimit if none exists for this route
    if (!uniqueRateLimits[route]) {
      uniqueRateLimits[route] = new RateLimit({
        windowMs: 60 * 1000, // 1 minute window
        delayMs: 0, // disable delaying - full speed until the max limit is reached
        max: maxRequests, // start blocking after maxRequests
        handler: function(
          req: express.Request,
          res: express.Response /*next*/
        ) {
          //console.log(`freemium rate-handler triggered.`)

          res.status(429) // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
          return res.json({
            error: `Too many requests. Limits are ${maxRequests} requests per minute.`
          })
        }
      })
    }
  }

  // Call rate limit for this route
  uniqueRateLimits[route](req, res, next)
}
