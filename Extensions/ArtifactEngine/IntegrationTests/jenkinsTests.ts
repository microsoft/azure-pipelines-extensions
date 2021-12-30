import * as assert from 'assert';
import * as engine from "../Engine"
import * as providers from "../Providers"

import { BasicCredentialHandler } from "../Providers/typed-rest-client/handlers/basiccreds";
import { TicketState } from '../Models/ticketState';

var sinon = require('sinon');
var nock = require('nock')

describe('Integration Tests', () => {
    describe('jenkins tests', () => {
        beforeEach(() => {
            nock.cleanAll();
        });

        it('should be able to download jenkins artifact', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            setUpNock();

            var processItemsPromise = processor.processItems(webProvider, stubProvider, processorOptions);
            processItemsPromise.then((tickets) => {
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb"], "dummyFileContent");
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt"], "dummyFolderContent");
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "").retryCount, 0);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 0);
                done();
            }, (err) => {
                throw err;
            });
        });

        it('should retry if getItems call fails.', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/api/json')
                .query({ "tree": "artifacts[*]" })
                .replyWithError('something awful happened');

            setUpNock();

            var processItemsPromise = processor.processItems(webProvider, stubProvider, processorOptions);
            processItemsPromise.then((tickets) => {
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb"], "dummyFileContent");
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt"], "dummyFolderContent");
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "").retryCount, 1);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 0);
                done();
            }, (err) => {
                throw err;
            });
        });

        it('should retry if getItem call fails.', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt')
                .replyWithError('something awful happened');

            setUpNock();

            var processItemsPromise = processor.processItems(webProvider, stubProvider, processorOptions);
            processItemsPromise.then((tickets) => {
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb"], "dummyFileContent");
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt"], "dummyFolderContent");
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "").retryCount, 0);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 1);
                done();
            }, (err) => {
                throw err;
            });
        });

        it('should retry if putArtifactItem fails.', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();
            var path;

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb')
                .basicAuth({
                    user: 'username',
                    pass: 'password'
                })
                .reply(200, "dummyFileContent");

            var fakePutArtifactItem = (item, stream) => {
                return new Promise((resolve, reject) => { reject("error in putArtifactItem") });
            };
            setUpNock();

            sinon.stub(stubProvider, "putArtifactItem")
                .onFirstCall()
                .callsFake(fakePutArtifactItem)
                .callThrough();

            processor.processItems(webProvider, stubProvider, processorOptions)
                .then((tickets) => {
                    assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb"], "dummyFileContent");
                    assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt"], "dummyFolderContent");
                    assert.strictEqual(tickets.find(x => x.artifactItem.path == "").retryCount, 0);
                    assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 1);
                    assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 0);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('should fail download if getItem call fails with unknown error', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();
            let errorMessage = 'something awful happened';

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt')
                .times(2)
                .replyWithError(errorMessage);

            setUpNock();

            processor.processItems(webProvider, stubProvider, processorOptions)
                .then((tickets) => {
                    assert.fail();
                }, (err) => {
                    assert.strictEqual(err.message, errorMessage);
                    done();
                });
        });

        it('should fail download if getItem call fails with 404', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt')
                .times(2)
                .reply(404);

            setUpNock();

            processor.processItems(webProvider, stubProvider, processorOptions)
                .then((tickets) => {
                    assert.fail();
                }, (err) => {
                    assert.strictEqual(err.statusCode, 404);
                    done();
                });
        });

        it('should fail download if getItem call fails with 500', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt')
                .times(2)
                .reply(500);

            setUpNock();

            processor.processItems(webProvider, stubProvider, processorOptions)
                .then((tickets) => {
                    assert.fail();
                }, (err) => {
                    assert.strictEqual(err.statusCode, 500);
                    done();
                });
        });

        it('should download only artifact items matching include pattern', (done) => {
            let processor = new engine.ArtifactEngine();
            let processorOptions = getArtifactEngineOptions();
            let webProvider = getJenkinsWebProvider();
            let stubProvider = new providers.StubProvider();

            processorOptions.itemPattern = 'Extensions/ArtifactEngine/TestData/Jenkins/folder2/**\n!Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder1/**\nExtensions/ArtifactEngine/TestData/Jenkins/folder3/file4.txt';

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/api/json')
                .query({ "tree": "artifacts[*]" })
                .basicAuth({
                    user: 'username',
                    pass: 'password'
                })
                .reply(200, {
                    "artifacts": [
                        { "displayPath": "file1.pdb", "fileName": "file1.pdb", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/folder2/file1.pdb" },
                        { "displayPath": "file2.txt", "fileName": "file2.txt", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder1/file2.txt" },
                        { "displayPath": "file3.txt", "fileName": "file3.txt", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder2/file3.txt" },
                        { "displayPath": "file4.txt", "fileName": "file4.txt", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/folder3/file4.txt" }
                    ]
                });

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder2/file1.pdb')
                .basicAuth({
                    user: 'username',
                    pass: 'password'
                })
                .reply(200, "dummyFile1Content");

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder1/file2.txt')
                .basicAuth({
                    user: 'username',
                    pass: 'password'
                })
                .reply(200, "dummyFile2Content");

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder2/file3.txt')
                .basicAuth({
                    user: 'username',
                    pass: 'password'
                })
                .reply(200, "dummyFile3Content");

            nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
                .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder3/file4.txt')
                .basicAuth({
                    user: 'username',
                    pass: 'password'
                })
                .reply(200, "dummyFile4Content");

            var processItemsPromise = processor.processItems(webProvider, stubProvider, processorOptions);
            processItemsPromise.then((tickets) => {
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder2/file1.pdb"], "dummyFile1Content");
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder2/file3.txt"], "dummyFile3Content");
                assert.strictEqual(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder3/file4.txt"], "dummyFile4Content");
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder2/file1.pdb").state, TicketState.Processed);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder1/file2.txt").state, TicketState.Skipped);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder2/subFolder2/file3.txt").state, TicketState.Processed);
                assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder3/file4.txt").state, TicketState.Processed);
                done();
            }, (err) => {
                throw err;
            });
        });

        after(() => {
            nock.cleanAll();
            nock.enableNetConnect();
        })
    });
});

function setUpNock() {

    nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
        .get('/job/ArtifactEngineJob/6/api/json')
        .query({ "tree": "artifacts[*]" })
        .basicAuth({
            user: 'username',
            pass: 'password'
        })
        .reply(200, { "artifacts": [{ "displayPath": "file1.pdb", "fileName": "file1.pdb", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb" }, { "displayPath": "file2.txt", "fileName": "file2.txt", "relativePath": "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt" }] });

    nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
        .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb')
        .basicAuth({
            user: 'username',
            pass: 'password'
        })
        .reply(200, "dummyFileContent");

    nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
        .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt')
        .basicAuth({
            user: 'username',
            pass: 'password'
        })
        .reply(200, "dummyFolderContent");
}

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
    var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, { ignoreSslError: false });

    return webProvider;
}