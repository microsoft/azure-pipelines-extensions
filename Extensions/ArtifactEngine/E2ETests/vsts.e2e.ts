import * as assert from 'assert';
import * as path from 'path'
import * as fs from 'fs'

import * as engine from "../Engine"
import * as providers from "../Providers"
import * as models from '../Models';

import { PersonalAccessTokenCredentialHandler } from "../Providers/typed-rest-client/handlers/personalaccesstoken";

var nconf = require('nconf');

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

            var handler = new PersonalAccessTokenCredentialHandler(nconf.get('VSTS:PAT'));
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

        it('should be able to incrementally download build artifact from vsts drop', function (done) {
            this.timeout(15000);

            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.artifactCacheHashKey = "default_Collection.123.2048.vstsdrop";
            processorOptions.artifactCacheDirectory = path.join(nconf.get('CACHE'));
            processorOptions.enableIncrementalDownload = true;
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 2;
            processorOptions.verbose = true;

            var itemsUrl1 = "https://testking123.visualstudio.com/_apis/resources/Containers/2631516?itemPath=drop&isShallow=false";
            var itemsUrl2 = "https://testking123.visualstudio.com/_apis/resources/Containers/2631521?itemPath=drop&isShallow=false";
            var variables = {};

            var handler = new PersonalAccessTokenCredentialHandler(nconf.get('VSTS:PAT'));
            var webProvider1 = new providers.WebProvider(itemsUrl1, "vsts.handlebars", variables, handler, { ignoreSslError: false }, "drop");
            var webProvider2 = new providers.WebProvider(itemsUrl2, "vsts.handlebars", variables, handler, { ignoreSslError: false }, "drop");

            var dropLocation = path.join(nconf.get('DROPLOCATION'));
            var filesystemProvider = new providers.FilesystemProvider(dropLocation, "drop");

            processor.processItems(webProvider1, filesystemProvider, processorOptions)
                .then((tick) => {
                    processor.processItems(webProvider2, filesystemProvider, processorOptions)
                        .then((tickets) => {
                            tickets.forEach((ticket) => {
                                if (ticket.artifactItem.itemType !== models.ItemType.Folder) {
                                    if (path.normalize(ticket.artifactItem.path) === "drop\\File3.txt") {
                                        assert.equal(true, ticket.downloadedFromCache)
                                        done();
                                    }
                                    else if (path.normalize(ticket.artifactItem.path) === "drop\\Folder1\\File1.txt") {
                                        assert.equal(true, ticket.downloadedFromCache)
                                    }
                                    else if (path.normalize(ticket.artifactItem.path) === "drop\\Folder1\\File2.txt") {
                                        assert.equal(false, ticket.downloadedFromCache)
                                    }
                                    else {
                                        assert.equal(false, ticket.downloadedFromCache);
                                    }
                                }
                            });
                        }, (err) => {
                            throw err;
                        });
                }, (error) => {
                    throw error;
                });
        });

        it('should be able to incrementally download build artifact from vsts drop with different itemPattern', function (done) {
            this.timeout(15000);

            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "drop\\Folder1\\**";
            processorOptions.artifactCacheHashKey = "default_Collection.123.2048.vstsdrop";
            processorOptions.artifactCacheDirectory = path.join(nconf.get('CACHE'));
            processorOptions.enableIncrementalDownload = true;
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 2;
            processorOptions.verbose = true;

            var itemsUrl1 = "https://testking123.visualstudio.com/_apis/resources/Containers/2631516?itemPath=drop&isShallow=false";
            var itemsUrl2 = "https://testking123.visualstudio.com/_apis/resources/Containers/2632010?itemPath=drop&isShallow=false";
            var variables = {};

            var handler = new PersonalAccessTokenCredentialHandler(nconf.get('VSTS:PAT'));
            var webProvider1 = new providers.WebProvider(itemsUrl1, "vsts.handlebars", variables, handler, { ignoreSslError: false }, "drop");
            var webProvider2 = new providers.WebProvider(itemsUrl2, "vsts.handlebars", variables, handler, { ignoreSslError: false }, "drop");

            var dropLocation = path.join(nconf.get('DROPLOCATION'));
            var filesystemProvider = new providers.FilesystemProvider(dropLocation, "drop");

            processor.processItems(webProvider1, filesystemProvider, processorOptions)
                .then((tick) => {
                    assert.equal(models.TicketState.Skipped, (tick.find(x => path.normalize(x.artifactItem.path) === "drop\\File3.txt")).state);
                    processorOptions.itemPattern = "**";
                    processor.processItems(webProvider2, filesystemProvider, processorOptions)
                        .then((tickets) => {
                            tickets.forEach((ticket) => {
                                if (ticket.artifactItem.itemType !== models.ItemType.Folder) {
                                    if (path.normalize(ticket.artifactItem.path) === "drop\\File3.txt") {
                                        assert.equal(false, ticket.downloadedFromCache)
                                        done();
                                    }
                                    else if (path.normalize(ticket.artifactItem.path) === "drop\\Folder1\\File1.txt") {
                                        assert.equal(true, ticket.downloadedFromCache)
                                    }
                                    else {
                                        assert.equal(false, ticket.downloadedFromCache);
                                    }
                                }
                            });
                        }, (err) => {
                            throw err;
                        });
                }, (error) => {
                    throw error;
                });
        });
    });
});