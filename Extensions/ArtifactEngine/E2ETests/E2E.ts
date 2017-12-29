import * as assert from 'assert';
import * as path from 'path'
import * as fs from 'fs'

import * as models from "../Models"
import * as engine from "../Engine"
import * as providers from "../Providers"

import { BasicCredentialHandler } from "../Providers/typed-rest-client/handlers/basiccreds";
import { PersonalAccessTokenCredentialHandler } from "../Providers/typed-rest-client/handlers/personalaccesstoken";
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { TicketState } from '../Models/ticketState';
import { ItemType } from '../Models/itemType';

var config = require("../test.config.json")

describe('e2e tests', () => {
    /* it('should be able to download jenkins artifact', function (done) {
        this.timeout(15000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 2;
        processorOptions.retryLimit = 2;
        processorOptions.verbose = true;

        var itemsUrl = "http://rmcdpjenkins2.southindia.cloudapp.azure.com:8080/job/ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/SmallProject/10/api/json?tree=artifacts[*]";
        var variables = {
            "endpoint": {
                "url": "http://rmcdpjenkins2.southindia.cloudapp.azure.com:8080"
            },
            "definition": "ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/SmallProject",
            "version": "10"
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
                throw error;
            });
    }); */

    it('should be able to download jenkins artifact', function (done) {
        this.timeout(15000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 2;
        processorOptions.retryLimit = 2;
        processorOptions.verbose = true;

        var itemsUrl = "http://rmcdpjenkins2.southindia.cloudapp.azure.com:8080/job/ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/SmallProject/10/artifact/*zip*/";
        var handler = new BasicCredentialHandler(config.jenkins.username, config.jenkins.password);
        var zipProvider = new providers.ZipProvider(itemsUrl, handler, { ignoreSslError: false });
        var dropLocation = path.join(config.dropLocation, "jenkinsDropWithMultipleFiles");
        var filesystemProvider = new providers.FilesystemProvider(dropLocation);

        processor.processItems(zipProvider, filesystemProvider, processorOptions)
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
                throw error;
            });
    });

/*     it('should be able to download build artifact from vsts drop', function (done) {
        this.timeout(15000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 2;
        processorOptions.retryLimit = 2;
        processorOptions.verbose = true;

        var itemsUrl = "https://testking123.visualstudio.com/_apis/resources/Containers/1898832?itemPath=Dropz&isShallow=false";
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
            }, (error) => {
                throw error;
            });
    });

    it('should be able to download build artifact from fileshare', function (done) {
        this.timeout(15000);
        let processor = new engine.ArtifactEngine();

        let processorOptions = new engine.ArtifactEngineOptions();
        processorOptions.itemPattern = "**";
        processorOptions.parallelProcessingLimit = 8;
        processorOptions.retryIntervalInSeconds = 2;
        processorOptions.retryLimit = 2;
        processorOptions.verbose = true;

        var itemsUrl = "//vscsstor/Users/gykuma/ArtifactEngineTestData/dropz/";
        var variables = {};

        var sourceProvider = new providers.FilesystemProvider(itemsUrl);
        var dropLocation = path.join(config.dropLocation, "fileshareWithMultipleFiles");
        var destProvider = new providers.FilesystemProvider(dropLocation);

        processor.processItems(sourceProvider, destProvider, processorOptions)
            .then((tickets) => {
                fs.readFile(path.join(config.dropLocation, 'fileshareWithMultipleFiles/folder1/file2.txt'), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(data, "dummyFolderContent");
                    done();
                });

                assert.equal(tickets.find(x => x.artifactItem.path == "file1.pdb").retryCount, 0);
                assert.equal(tickets.find(x => x.artifactItem.path == path.join("folder1","file2.txt")).retryCount, 0);
            }, (error) => {
                throw error;
            });
    }); */
});