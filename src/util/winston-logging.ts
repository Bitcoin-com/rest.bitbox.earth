/*
  Instantiates and configures the Winston logging library. This utitlity library
  can be called by other parts of the application to conveniently tap into the
  logging library.
*/

let winston: any = require("winston")
require("winston-daily-rotate-file")

let NETWORK: string | undefined = process.env.NETWORK

// Configure daily-rotation transport.
let transport: any = new winston.transports.DailyRotateFile({
  filename: `${__dirname}/../../logs/rest-${NETWORK}-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "1m",
  maxFiles: "5d",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
})

// This controls what goes into the log FILES
export const wlogger: any = winston.createLogger({
  level: "verbose",
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' })
    transport
  ]
})

// This controls the logs to CONSOLE
/*
wlogger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
    level: "info"
  })
)
*/

transport.on("rotate", function(oldFilename: any, newFilename: any): void {
  wlogger.info("Rotating log files")
})
