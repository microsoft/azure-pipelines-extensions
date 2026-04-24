import * as assert from 'assert';

import * as engine from "../Engine"
import * as providers from "../Providers"
import { BasicCredentialHandler } from "../Providers/typed-rest-client/handlers/basiccreds";

var nock = require('nock');

describe('Integration Tests', () => {
    describe('proxy tests', () => {

        beforeEach(() => {
            nock.cleanAll();
        });

        it('should be able to download jenkins artifact under proxy', function (done) {

            // Mock the Jenkins endpoint with nock. nock patches http.ClientRequest
            // at the module level so it intercepts before any proxy agent can
            // open a socket, which means we don't need a real local proxy server.
            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/api/json')
                .query({ "tree": "artifacts[*]" })
                .basicAuth({ user: 'username', pass: 'password' })
                .reply(200, {
                    "artifacts": [
                        { "displayPath": "file1.pdb", "fileName": "file1.pdb", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb" },
                    ]
                });

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb')
                .basicAuth({ user: 'username', pass: 'password' })
                .reply(200, 'dummyFileContent');

            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            var processItemsPromise = processor.processItems(webProvider, stubProvider, processorOptions);
            processItemsPromise.then((tickets) => {
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb"], "dummyFileContent");
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                done();
            }, (err) => {
                done(err);
            });
        });
    });
});

function getArtifactEngineOptions(): engine.ArtifactEngineOptions {
    let processorOptions = new engine.ArtifactEngineOptions();
    processorOptions.fileProcessingTimeoutInMinutes = 5;
    processorOptions.itemPattern = "**";
    processorOptions.parallelProcessingLimit = 8;
    processorOptions.retryIntervalInSeconds = 0;
    processorOptions.retryLimit = 2;
    processorOptions.verbose = true;

    return processorOptions;
}

function getJenkinsWebProvider(): providers.WebProvider {
    var itemsUrl = "http://redvstt-lab43:8080/job/ArtifactEngineJob/6/api/json?tree=artifacts[*]"
    var variables = {
        "endpoint": {
            "url": "http://redvstt-lab43:8080"
        },
        "definition": "ArtifactEngineJob",
        "version": "6"
    };

    var handler = new BasicCredentialHandler("username", "password");
    var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, {
        ignoreSslError: false,
        keepAlive: true,
        proxy: {
            proxyUrl: 'http://127.0.0.1:9011',
            proxyUsername: 'admin:123',
            proxyPassword: 'pass#123:'
        }
    });

    return webProvider;
}