# FTP downloader for appengine

Designed to aid in the downloads and retrieval of FTP files in appengine.  Appengine does not support making FTP requests from instances and this is lighter weight than full on GCE instances.

Simply put, you pass this cloud function some parameters, the cloud function saves the requested file to a GCS bucket, which is then easily retrievable from GAE.

## Usage

No config file is required when deployed as default project and service account will be used.

The only deployed requirement is that the following APIs are enabled:

1. Cloud Datastore
2. Cloud Functions
3. Cloud Storage

To develop locally, you can use the cloud function emulator.  Documentation to set up the emulator can be found [here.](https://cloud.google.com/functions/docs/emulator)

Once setup, test locally with...

1. Start the emulator: `functions start`
2. Deploy the cloud function: `functions deploy importFTP --trigger-http`
3. Test the function: `functions call importFTP --data '{"bucketName": "bucket", "host":"host", "user":"user", "password":"password", "fileName":"file.txt"}'`
4. Optionally stop the emulator: `functions stop`

## Deployment

Cloud deployment is actually really similar to local usage and documentation can be found [here.](https://cloud.google.com/functions/docs/deploying/filesystem)

### Setup

You'll need the latest gcloud components installed, which can be found [here.](https://cloud.google.com/sdk/gcloud/)

Otherwise, you'll need to update, `gcloud components update`.

Deployment and testing uses default credentials with the gcloud tool.  You'll need to set those using the documentation found [here.](https://developers.google.com/identity/protocols/application-default-credentials)

tl;dr, run `gcloud auth application-default login` to set default credentials.  These should be credentials that have access to your project.

You can also set a default project using `gcloud config set project <project_id>`.

If you choose not to do so, or you want to deploy in a project different than default, use the `--project=<project_id>` flag with the following commands.

### Deploy

As a sample:
1. `git clone https://github.com/RealKinetic/ftp-bucket.git`
2. `cd ftp-bucket`
3. If you don't already have a GCS bucket: `gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]`
4. Deploy: `gcloud beta functions deploy importFTP --stage-bucket [BUCKET_NAME] --trigger-http`
5. Test: `gcloud beta functions call importFTP --data '{"bucketName": "bucket", "host":"host", "user":"user", "password":"password", "fileName":"file.txt"}'`
6. Optionally delete when done: `gcloud beta functions delete importFTP`

## Debugging

Logs are available for viewing.  Locally, using the emulator, you can view logs with `functions logs read`.

When deployed, you can view the logs using `gcloud beta functions logs read importFTP`.

## Testing

If you want to test locally...
1. Install all dependencies: `npm install`
2. Run the tests: `npm run test`

## TODO

There are clearly more tests to write.  Also, we might think of making this a general proxy into all major FTP functions.  It might also be nice to include a config.json file so the consumer doesn't have to send username/password all the time.  Or at least make this part optional.