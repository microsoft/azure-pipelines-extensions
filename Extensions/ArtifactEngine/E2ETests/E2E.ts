import * as assert from 'assert';
import * as path from 'path'
import * as fs from 'fs'

import * as models from "../Models"
import * as engine from "../Engine"
import * as providers from "../Providers"

import { BasicCredentialHandler } from "../Providers/handlers/basiccreds";
import { PersonalAccessTokenCredentialHandler } from "../Providers/handlers/personalaccesstoken";
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { TicketState } from '../Models/ticketState';
import { ItemType } from '../Models/itemType';

var config = require("./config.json")

describe('e2e tests', () => {
    it('should be able to download jenkins artifact', function (done) {
        this.timeout(15000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 1000;
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

        var handler = new BasicCredentialHandler(config.jenkins.username, config.jenkins.password);
        var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, { ignoreSslError: false });
        var dropLocation = path.join(config.dropLocation, "jenkinsDropWithMultipleFiles");
        var filesystemProvider = new providers.FilesystemProvider(dropLocation);

        processor.processItems(webProvider, filesystemProvider, processorOptions)
            .then((tickets) => {
                fs.readFile(path.join(config.dropLocation, 'jenkinsDropWithMultipleFiles/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt'), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(data, "dummyFolderContent");
                    done();
                });

                assert.equal(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                assert.equal(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 0);
            }, (error) => {
                throw "test failure";
            });
    });

    it('should be able to download build artifact', function (done) {
        this.timeout(15000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 1000;
        processorOptions.retryLimit = 2;
        processorOptions.verbose = true;

        var itemsUrl = "https://testking123.visualstudio.com/_apis/resources/Containers/1898832?itemPath=Dropz&isShallow=false"
        var variables = {};

        var handler = new PersonalAccessTokenCredentialHandler(config.vsts.pat);
        var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
        var dropLocation = path.join(config.dropLocation, "vstsDropWithMultipleFiles");
        var filesystemProvider = new providers.FilesystemProvider(dropLocation);

        processor.processItems(webProvider, filesystemProvider, processorOptions)
            .then((tickets) => {
                fs.readFile(path.join(config.dropLocation, 'vstsDropWithMultipleFiles/dropz/folder1/file2.txt'), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(data, "dummyFolderContent");
                    done();
                });

                assert.equal(tickets.find(x => x.artifactItem.path == "dropz/file1.pdb").retryCount, 0);
                assert.equal(tickets.find(x => x.artifactItem.path == "dropz/folder1/file2.txt").retryCount, 0);
                done();
            }, (error) => {
                throw "test failure";
            });
    });

    it('should be able to download large build artifact', function (done) {
        this.timeout(200000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 1000;
        processorOptions.retryLimit = 5;
        processorOptions.verbose = true;

        var itemsUrl = "https://testking123.visualstudio.com/_apis/resources/Containers/1902716?itemPath=largedrop&isShallow=false"
        var variables = {};

        var handler = new PersonalAccessTokenCredentialHandler(config.vsts.pat);
        var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
        var dropLocation = path.join(config.dropLocation, "vstsDropWithLargeFiles");
        var filesystemProvider = new providers.FilesystemProvider(dropLocation);

        processor.processItems(webProvider, filesystemProvider, processorOptions)
            .then((tickets) => {
                assert.equal(tickets.filter(x => x.artifactItem.itemType === ItemType.File && x.state === TicketState.Processed).length, 301);
                done();
            });
    });
});