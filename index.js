'use strict';


// [START functions_setup]
// Standard ftp client wrapped with promises.
const PromiseFtp = require('promise-ftp');
// Parameterless call on the require automatically sets up authentication
// when deployed to cloud functions.  Find more here:
// https://github.com/GoogleCloudPlatform/google-cloud-node/tree/master/packages/storage
const storage = require('@google-cloud/storage')();
// [END functions_setup]


// [START functions_ftp_get]
/**
 * Starts the process of fetching data from the ftp server and saving it
 * to the GCS bucket.  All parameters are specified in options.
 *
 * @param {object} ftp PromiseFtp.
 * @param {string} host Hostname of the FTP server.
 * @param {string} fileName Name of the file to transfer.
 * @param {string} user Optional FTP username.
 * @param {string} password Optional FTP password.
 * @returns {object} Promise object.
 */
function ftpGet (ftp, host, fileName, user, password) {
    // we don't specify any catch here, leaving it up to the caller.
    return ftp.connect({
        host: host,
        user: user,
        password: password
    }).then(function (serverMessage) {
        return ftp.get(fileName);
    });
}
// [END functions_ftp_get]

// [START functions_cloud_put]
/**
 * Pipes the provided stream into the GCS bucket.  Throws exception if there's
 * a problem.
 *
 * @param {string} bucketName Name of the bucket to transfer to.
 * @param {string} fileName Name of the file to transfer.
 * @param {object} stream Stream containing data.
 */
function putStorage(bucketName, fileName, stream) {
    var writeStream = storage.bucket(bucketName)
        .file(fileName)
        .createWriteStream();
    stream.pipe(writeStream);
}
// [END functions_cloud_put]

// [START functions_validate]
/**
 * Validates the incoming request.  Ensures required fields are present.  If
 * not, this throws an Error with the code set to 400.
 *
 * @param {object} req Request body.
 * @param {string} req.bucketName Required name of the GCS bucket.
 * @param {string} req.host Required FTP host name.
 * @param {string} req.fileName Required name of the file to transfer.
 * @param {string} req.user Optional FTP username.
 * @param {string} req.password Optional FTP password.
 */
function validationRequest(req) {
    var requiredProps = ['bucketName', 'host', 'fileName'];
    var length = requiredProps.length;
    var error = null;
    if (req == null || !req) {
        error = new Error('Body required');
    }

    for (var i = 0; i < length; i++) {
        if (!checkStringNotEmpty(req, requiredProps[i])) {
            error = new Error(
                'Required property: ' + requiredProps[i] + ' not found'
            );
            break;
        }
    }

    if (error != null) {
        error.code = 400;
        throw error;
    }
}

/**
 * Checks that the provided request has the provided property and that the
 * property is a string and not empty.
 *
 * @param {object} req Request body.
 * @param {string} prop Property to look at.
 * @returns {bool} Indicates if property exists, is string, and not empty.
 */
function checkStringNotEmpty(req, prop) {
    return req.hasOwnProperty(prop)
           && typeof req[prop] === 'string'
           && req[prop].length;
}
// [END functions_validate]

// [START functions_utility]
/*
 * Utility function for making an error response from an error.
 *
 * @param {object} err Error object.
 * @returns {object} Response object.
 */
function makeErrorResponse(err) {
    return err;
}
// [END functions_utility]


// [START functions_endpoint]
/**
 * HTTP handler for grabbing an object from an FTP server and moving it to
 * a GCS bucket.  This is useful for applications running an app engine that
 * can't get native FTP access.  This cloud function as an easy, low-cost, way
 * to bypass that limitation.
 *
 * Trigger this function by making a POST request with payload to
 * https://[YOUR_REGION]-[YOUR_PROJECT_ID].cloudfunctions.net/importFTP
 *
 * @example
 * curl -X POST "https://us-central1-test-project.cloudfunctions.net/importFTP" --data '{"bucketName": "my bucket", "host":"test.ftp.com", "user":"username", "password":"password", "fileName":"data.csv"}' --header "Content-Type: application/json"
 *
 * @param {object} req Cloud Function request context.
 * @param {string} req.body.bucketName Required name of the GCS bucket.
 * @param {string} req.body.host Required FTP host name.
 * @param {string} req.body.fileName Required name of the file to transfer.
 * @param {string} req.body.user Optional FTP username.
 * @param {string} req.body.password Optional FTP password.
 * @param {object} res Cloud Function response context.
 */
exports.importFTP = function importFTP (req, res) {
    var ftp = new PromiseFtp();
    return Promise.resolve()
        .then(() => {
            if (req.method !== 'POST') {
                const error = new Error('Only POST requests are accepted');
                error.code = 405;
                throw error;
            }

            validationRequest(req.body); // ensure we have all the data we need

            return ftpGet(
                ftp, req.body.host, req.body.fileName, req.body.user, req.body.password
            );
        })
        .then((stream) => {
            return new Promise(function (resolve, reject) {
                stream.once('close', resolve);
                stream.once('error', reject);
                putStorage(req.body.bucketName, req.body.fileName, stream);
            });
        })
        .then(() => {
            return ftp.end();
        })
        .then(() => {
            res.status(200).json({"message": "success"}).end();
        })
        .catch((err) => {
            console.error(err);
            if (err.code && err.code == 550) { // file not found
                res.status(404).send(makeErrorResponse(err));
            } else if (err.code && err.code == 530) { // unauthorized
                res.status(401).send(makeErrorResponse(err));
            } else {
                res.status(err.code || 500).send(makeErrorResponse(err));
            }
        });
};
// [END functions_endpoint]