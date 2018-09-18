/*
*/

"use strict";

const sinon = require("sinon");

const util = require("util");
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
};

const testMock1 = myarg => {
  console.log(`testMock1: ${util.inspect(myarg)}`);
};
testMock1({ a: 1, b: 2 });

const testMock2 = sinon.stub();
testMock2.returns("blah");
console.log(`testMock2: ${testMock2()}`);

const testMock3 = sinon.stub();
//testMock3.returns(arg => testMock1(arg));
//testMock3({ c: 3, d: 4 });
testMock3.callsFake(testMock1({ c: 3, d: 4 }));
