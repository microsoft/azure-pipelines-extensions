import * as assert from 'assert';
import * as path from 'path'
import * as fs from 'fs'

import * as engine from "../Engine"
import * as providers from "../Providers"

import { PersonalAccessTokenCredentialHandler } from "../Providers/typed-rest-client/handlers/personalaccesstoken";

var nconf = require('nconf');
var tl = require('azure-pipelines-task-lib/task');

nconf.argv()
    .env()
    .file(__dirname + '/../test.config.json');

describe('E2E Tests', () => {
    describe('VSTS', () => {
        it('should be able to download build artifact from vsts drop', function (done) {
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

            var handler = new PersonalAccessTokenCredentialHandler(nconf.get('VSTS:PAT') || tl.getVariable('VSTS:PAT'));
            var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "vstsDropWithMultipleFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    fs.readFile(path.join(nconf.get('DROPLOCATION'), 'vstsDropWithMultipleFiles/dropz/folder1/file2.txt'), 'utf8', function (err, data) {
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
    });
});