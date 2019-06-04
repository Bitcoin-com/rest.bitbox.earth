/*
  A utility library for setting up greylog2 logging.
*/

// This will be uncommented and correct once we have our logging server functioning.
/*
var graylog2 = require("graylog2");
var logger = new graylog2.graylog({
    servers: [
        { 'host': '127.0.0.1', port: 12201 },
        { 'host': '127.0.0.2', port: 12201 }
    ],
    hostname: 'server.name', // the name of this host
                             // (optional, default: os.hostname())
    facility: 'Node.js',     // the facility for these log messages
                             // (optional, default: "Node.js")
    bufferSize: 1350         // max UDP packet size, should never exceed the
                             // MTU of your system (optional, default: 1400)
});

logger.on('error', function (error) {
    console.error('Error while trying to write to graylog2:', error);
});
*/

// This is just a placeholder function that will be replaced once we get the
// greylog server working.
export function log(msg: string, obj: any): void {
  //console.log(msg, obj)
}

// This is just a placeholder function that will be replaced once we get the
// greylog server working.
export function error(msg: string, obj?: any): void {
  if (!obj) console.error(msg)
  else console.error(msg, obj)
}

// This is just a placeholder function that will be replaced once we get the
// greylog server working.
export function debug(msg: string, obj: any): void {
  //console.log(msg, obj)
}
