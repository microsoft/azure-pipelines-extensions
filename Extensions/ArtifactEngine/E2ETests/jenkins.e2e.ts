import * as assert from 'assert';
import * as path from 'path'
import * as fs from 'fs'

import * as engine from "../Engine"
import * as providers from "../Providers"

import { BasicCredentialHandler } from "../Providers/typed-rest-client/handlers/basiccreds";

var nconf = require('nconf');
var tl = require('azure-pipelines-task-lib/task');

nconf.argv()
    .env()
    .file(__dirname + '/../test.config.json');
describe('E2E Tests', () => {
    describe('Jenkins', () => {
        it('should be able to download jenkins artifact', function (done) {
            this.timeout(15000);
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 2;
            processorOptions.verbose = true;

            var itemsUrl = "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080/job/ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/SmallProject/3/api/json?tree=artifacts[*]";
            var variables = {
                "endpoint": {
                    "url": "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080"
                },
                "definition": "ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/SmallProject",
                "version": "3"
            };

            var handler = new BasicCredentialHandler(nconf.get('JENKINS:USERNAME'), nconf.get('JENKINS:PASSWORD') || tl.getVariable('JENKINS:PASSWORD'));
            var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "jenkinsDropWithMultipleFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    fs.readFile(path.join(nconf.get('DROPLOCATION'), 'jenkinsDropWithMultipleFiles/Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt'), 'utf8', function (err, data) {
                        if (err) {
                            throw err;
                        }
                        assert.strictEqual(data, "dummyFolderContent");
                        done();
                    });

                    assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/file1.pdb").retryCount, 0);
                    assert.strictEqual(tickets.find(x => x.artifactItem.path == "Extensions/ArtifactEngine/TestData/Jenkins/folder1/file2.txt").retryCount, 0);
                }, (error) => {
                    throw error;
                });
        });

        it('should be able to download jenkins artifact as zip', function (done) {
            this.timeout(15000);
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 2;
            processorOptions.verbose = true;

            var itemsUrl = "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080/job/ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/SmallProject/3/artifact/*zip*/";
            var handler = new BasicCredentialHandler(nconf.get('JENKINS:USERNAME'), nconf.get('JENKINS:PASSWORD')  || tl.getVariable('JENKINS:PASSWORD'));
            var zipProvider = new providers.ZipProvider(itemsUrl, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "jenkinsDropWithMultipleFiles.zip");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(zipProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    fs.existsSync(path.join(nconf.get('DROPLOCATION'), 'jenkinsDropWithMultipleFiles.zip'));
                    assert.strictEqual(tickets.find(x => x.artifactItem.path == "").retryCount, 0);
                    assert.notStrictEqual(tickets.find(x => x.artifactItem.path == "").fileSizeInBytes, 0);
                    done();
                }, (error) => {
                    throw error;
                });
        });

        it('should fail jenkins artifact download if zip location is not found', function (done) {
            this.timeout(10000);

            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 2;
            processorOptions.verbose = true;

            var itemsUrl = "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080///job/noexistant//8/artifact/*zip*/";
            var handler = new BasicCredentialHandler(nconf.get('JENKINS:USERNAME'), nconf.get('JENKINS:PASSWORD') || tl.getVariable('JENKINS:PASSWORD'));
            var zipProvider = new providers.ZipProvider(itemsUrl, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "jenkinsDropWithMultipleFiles.zip");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(zipProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    assert.fail();
                }, (error) => {
                    assert.strictEqual(error.statusCode, 404);
                    done();
                });
        });
    });
});