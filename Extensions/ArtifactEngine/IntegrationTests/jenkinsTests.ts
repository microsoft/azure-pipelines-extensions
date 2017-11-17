import * as assert from 'assert';
import * as path from 'path'

import * as models from "../Models"
import * as engine from "../Engine"
import * as providers from "../Providers"

import { BasicCredentialHandler } from "../Providers/handlers/basiccreds";
import { PersonalAccessTokenCredentialHandler } from "../Providers/handlers/personalaccesstoken";

var nock = require('nock')

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
    .replyWithError('something awful happened');

nock('http://redvstt-lab43:8080', { "encodedQueryParams": true })
    .get('/job/ArtifactEngineJob/6/artifact/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt')
    .basicAuth({
        user: 'username',
        pass: 'password'
    })
    .reply(200, "dummyFolderContent");

describe('processor.processItems', () => {
    it('should be able to download jenkins artifact', async () => {
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.fileProcessingTimeoutInMinutes = 5;
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 0;
        processorOptions.retryLimit = 2;
        processorOptions.verbose = true;

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
        var stubProvider = new providers.StubProvider();

        var processItemsPromise = processor.processItems(webProvider, stubProvider, processorOptions);
        processItemsPromise.catch((error) => {
            throw "test failure";
        })

        var tickets = await processItemsPromise;

        assert.equal(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb"], "dummyFileContent");
        assert.equal(stubProvider.itemsUploaded["Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt"], "dummyFolderContent");
        assert.equal(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
        assert.equal(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 1);
    });
});