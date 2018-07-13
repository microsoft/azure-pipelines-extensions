import * as assert from 'assert';
import * as path from 'path'

import * as engine from "../Engine"
import * as providers from "../Providers"

import { PersonalAccessTokenCredentialHandler } from "../Providers/typed-rest-client/handlers/personalaccesstoken";

var nconf = require('nconf');

nconf.argv()
    .env()
    .file(__dirname + '/../test.config.json');

describe('E2E Tests', () => {
    describe('Failing scenarios', () => {
        it('should fail download if get artifact items returns 404', function (done) {
            this.timeout(10000);

            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.retryLimit = 2;
            processorOptions.retryIntervalInSeconds = 1;
            processorOptions.verbose = true;

            var itemsUrl = "https://httpbin.org/status/404";
            var variables = {};

            var handler = new PersonalAccessTokenCredentialHandler("dummyPat");
            var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join("dummydroplocation", "vstsDropWithMultipleFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    assert.fail();
                }, (error) => {
                    assert.equal(error.statusCode, 404);
                    done();
                });
        })

        it('should fail download if get artifact items returns 401', function (done) {
            this.timeout(10000);

            let processor = new engine.ArtifactEngine();
            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.retryLimit = 1;
            processorOptions.verbose = true;
            var itemsUrl = "https://httpbin.org/status/401";
            var variables = {};

            var handler = new PersonalAccessTokenCredentialHandler("dummyPat");
            var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join("dummydroplocation", "vstsDropWithMultipleFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    assert.fail();
                }, (error) => {
                    assert.equal(error.statusCode, 401);
                    done();
                });
        })

        it('should fail download if get artifact items returns 500', function (done) {
            this.timeout(10000);

            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.retryLimit = 1;
            processorOptions.verbose = true;

            var itemsUrl = "https://httpbin.org/status/500";
            var variables = {};

            var handler = new PersonalAccessTokenCredentialHandler("dummyPat");
            var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join("dummydroplocation", "vstsDropWithMultipleFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    assert.fail();
                }, (error) => {
                    assert.equal(error.statusCode, 500);
                    done();
                });
        })
    });
});