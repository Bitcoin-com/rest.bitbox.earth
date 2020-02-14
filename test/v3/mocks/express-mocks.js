/*
  Contains mocks of Express req and res objects.
*/

const sinon = require("sinon")

// Inspect JS Objects.
const util = require("util")
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true
}

// mock for res.send()
function fakeSend(arg) {
  //console.log(`res.send: ${util.inspect(arg)}`);
  mockRes.output = arg
  return arg
}

// mock for res.json()
function fakeJson(arg) {
  //console.log(`res.json: ${util.inspect(arg)}`);
  mockRes.output = arg
  return arg
}

// mock for res.setStatus(num)
const setStatusCode = arg => {
  mockRes.statusCode = arg
}

const mockReq = {
  accepts: sinon.stub().returns({}),
  acceptsCharsets: sinon.stub().returns({}),
  acceptsEncodings: sinon.stub().returns({}),
  acceptsLanguages: sinon.stub().returns({}),
  body: {},
  flash: sinon.stub().returns({}),
  get: sinon.stub().returns({}),
  is: sinon.stub().returns({}),
  params: {},
  query: {},
  session: {},
  locals: {},
  headers: {}
}

const mockRes = {
  append: sinon.stub().returns({}),
  attachement: sinon.stub().returns({}),
  clearCookie: sinon.stub().returns({}),
  cookie: sinon.stub().returns({}),
  download: sinon.stub().returns({}),
  end: sinon.stub().returns({}),
  format: {},
  get: sinon.stub().returns({}),
  headersSent: sinon.stub().returns({}),
  json: sinon.stub().callsFake(fakeJson),
  jsonp: sinon.stub().returns({}),
  links: sinon.stub().returns({}),
  locals: {},
  location: sinon.stub().returns({}),
  output: null, // Used for retrieving output data.
  redirect: sinon.stub().returns({}),
  render: sinon.stub().returns({}),
  send: sinon.stub().callsFake(fakeSend),
  sendFile: sinon.stub().returns({}),
  sendStatus: sinon.stub().returns({}),
  set: sinon.stub().returns({}),
  status: sinon.stub().callsFake(setStatusCode),
  statusCode: null, // Default value before calling stats();
  type: sinon.stub().returns({}),
  vary: sinon.stub().returns({}),
  write: sinon.stub().returns({}),
  setHeader: sinon.stub().returns({}),
  format: sinon.stub().returns({})
}

const mockNext = sinon.stub().returns()

module.exports = {
  mockReq,
  mockRes,
  mockNext
}
