// Copyright 2017 Real Kinetic, LLC. All Rights Reserved.

'use strict';

const childProcess = require(`child_process`);
const sinon = global.sinon = require(`sinon`);
const test = global.test = require(`ava`);

global.run = (cmd, cwd) => {
  return childProcess.execSync(cmd, { cwd: cwd }).toString().trim();
};

global.runAsync = (cmd, cwd, cb) => {
  childProcess.exec(cmd, { cwd: cwd }, cb);
};

global.stubConsole = () => {
  if (typeof console.log.restore !== `function` && typeof console.error.restore !== `function`) {
    if (process.env.DEBUG) {
      sinon.spy(console, `error`);
      sinon.spy(console, `log`);
    } else {
      sinon.stub(console, `error`);
      sinon.stub(console, `log`, (a, b, c) => {
        if (typeof a === `string` && a.indexOf(`\u001b`) !== -1 && typeof b === `string`) {
          console.log.apply(console, arguments);
        }
      });
    }
  }
};

global.restoreConsole = () => {
  if (typeof console.log.restore === `function`) {
    console.log.restore();
  }
  if (typeof console.error.restore === `function`) {
    console.error.restore();
  }
};

test.beforeEach((t) => {
  // for future use
});