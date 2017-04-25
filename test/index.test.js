// Copyright 2017 Real Kinetic, LLC. All Rights Reserved.

'use strict';

var path = require('path');
require(path.resolve(__dirname, `./_setup.js`));

const proxyquire = require(`proxyquire`).noCallThru();

const method = `POST`;
const fileName = `fileName`;
const bucketName = `bucketName`;
const host = `host`;


function getSample () {
    const writeStream = {};
    const file = { createWriteStream : sinon.stub().returns(writeStream) };
    const bucket = { file: sinon.stub().returns(file) };
    const storage = { bucket: sinon.stub().returns(bucket) };
    const StorageMock = sinon.stub().returns(storage);

    const stream = {
        once: sinon.stub(),
        pipe: sinon.stub().returns({})
    };
    const ftp = {
        connect: sinon.stub().returns(Promise.resolve('message')),
        get: sinon.stub().returns(Promise.resolve(stream)),
        end: sinon.stub()
    };
    const FTPMock = sinon.stub().returns(ftp);

    return {
        program: proxyquire(`../`, {
            '@google-cloud/storage': StorageMock,
            'promise-ftp': FTPMock
        }),
        mocks: {
            file,
            bucket,
            storage,
            stream,
            ftp
        }
    };
}

function getMocks () {
    var req = {
        headers: {},
        query: {},
        body: {},
        get: function (header) {
          return this.headers[header];
        }
    };
    sinon.spy(req, 'get');
    var res = {
        headers: {},
        send: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
        end: sinon.stub().returnsThis(),
        status: function (statusCode) {
              this.statusCode = statusCode;
              return this;
        },
        set: function (header, value) {
            this.headers[header] = value;
            return this;
        }
    };
    sinon.spy(res, 'status');
    sinon.spy(res, 'set');
    return {
        req: req,
        res: res
    };
}

test.beforeEach(stubConsole);
test.afterEach.always(restoreConsole);

test.serial(`Send fails if not a POST request`, async (t) => {
      const error = new Error(`Only POST requests are accepted`);
      error.code = 405;
      const sample = getSample();
      const mocks = getMocks();

      await sample.program.importFTP(mocks.req, mocks.res);
      t.is(mocks.res.status.callCount, 1);
      t.deepEqual(mocks.res.status.firstCall.args, [405]);
      t.is(mocks.res.send.callCount, 1);
      t.deepEqual(mocks.res.send.firstCall.args, [error]);
});

test.serial(`Send fails if host not present`, async (t) => {
      const sample = getSample();
      const mocks = getMocks();

      mocks.req.method = method;
      mocks.req.body.bucketName = bucketName;
      mocks.req.body.fileName = fileName;

      await sample.program.importFTP(mocks.req, mocks.res);
      t.is(mocks.res.status.callCount, 1);
      t.deepEqual(mocks.res.status.firstCall.args, [400]);
      t.is(mocks.res.send.callCount, 1);
});

test.serial(`Send fails if bucketName not present`, async (t) => {
      const sample = getSample();
      const mocks = getMocks();

      mocks.req.method = method;
      mocks.req.body.host = host;
      mocks.req.body.fileName = fileName;

      await sample.program.importFTP(mocks.req, mocks.res);
      t.is(mocks.res.status.callCount, 1);
      t.deepEqual(mocks.res.status.firstCall.args, [400]);
      t.is(mocks.res.send.callCount, 1);
});

test.serial(`Send fails if fileName not present`, async (t) => {
      const sample = getSample();
      const mocks = getMocks();

      mocks.req.method = method;
      mocks.req.body.host = host;
      mocks.req.body.bucketName = bucketName;

      await sample.program.importFTP(mocks.req, mocks.res);
      t.is(mocks.res.status.callCount, 1);
      t.deepEqual(mocks.res.status.firstCall.args, [400]);
      t.is(mocks.res.send.callCount, 1);
});

test.serial(`Send fails if body not present`, async (t) => {
      const sample = getSample();
      const mocks = getMocks();

      mocks.req.method = method;
      mocks.req.body = {};

      await sample.program.importFTP(mocks.req, mocks.res);
      t.is(mocks.res.status.callCount, 1);
      t.deepEqual(mocks.res.status.firstCall.args, [400]);
      t.is(mocks.res.send.callCount, 1);
});
