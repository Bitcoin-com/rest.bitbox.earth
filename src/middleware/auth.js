/*
  Handle authorization for bypassing rate limits.

  This file uses the passport npm library to check the header of each REST API
  call for the prescence of a Basic authorization header:
  https://en.wikipedia.org/wiki/Basic_access_authentication

  If the header is found and validated, the req.locals.proLimit Boolean value
  is set and passed to the route-ratelimits.ts middleware.
*/

"use strict"

const passport = require("passport")
const BasicStrategy = require("passport-http").BasicStrategy
const AnonymousStrategy = require("passport-anonymous")

// Used for debugging and iterrogating JS objects.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

let _this

// Set default rate limit value for testing
const PRO_PASS = process.env.PRO_PASS
  ? parseInt(process.env.PRO_PASS)
  : "BITBOX"
console.log(`Current pro-tier password: ${PRO_PASS}`)

// Auth Middleware
class AuthMW {
  constructor() {
    _this = this

    // Initialize passport for 'anonymous' authentication.
    /*
    passport.use(
      new AnonymousStrategy({ passReqToCallback: true }, function(
        req,
        username,
        password,
        done
      ) {
        console.log(`anonymous auth handler triggered.`)
      })
    )
    */
    passport.use(new AnonymousStrategy())

    // Initialize passport for 'basic' authentication.
    passport.use(
      new BasicStrategy({ passReqToCallback: true }, function(
        req,
        username,
        password,
        done
      ) {
        //console.log(`req: ${util.inspect(req)}`)
        //console.log(`username: ${username}`)
        //console.log(`password: ${password}`)

        // Create the req.locals property if it does not yet exist.
        if (!req.locals) req.locals = {}

        // Evaluate the username and password and set the rate limit accordingly.
        if (username === "BITBOX" && password === PRO_PASS) {
          // Success
          req.locals.proLimit = true
        } else {
          req.locals.proLimit = false
        }

        //console.log(`req.locals: ${util.inspect(req.locals)}`)

        return done(null, true)
      })
    )
  }

  // Middleware called by the route.
  mw() {
    return passport.authenticate(["basic", "anonymous"], {
      session: false
    })
  }
}

module.exports = AuthMW
