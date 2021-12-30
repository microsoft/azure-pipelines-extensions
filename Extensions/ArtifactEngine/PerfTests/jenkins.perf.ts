import * as assert from 'assert';
import * as path from 'path'
import * as fs from 'fs'

import * as engine from "../Engine"
import * as providers from "../Providers"

import { BasicCredentialHandler } from "../Providers/typed-rest-client/handlers/basiccreds";
import { TicketState } from '../Models/ticketState';
import { ItemType } from '../Models/itemType';
import { ArtifactDownloadTicket } from '../Models/artifactDownloadTicket';

var nconf = require('nconf');

nconf.argv()
    .env()
    .file(__dirname + '/../test.config.json');

describe('Perf Tests', () => {
    describe('jenkins perf tests', () => {
        //Artifact details => Source: Jenkins, FilesCount: 301, DownloadSize: ~1.7GB, TotalFileSize: ~1.7GB
        it('should be able to download large size jenkins artifact', function (done) {
            this.timeout(300000);   //5mins
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 4;
            processorOptions.verbose = true;

            var itemsUrl = "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080/job/ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/LargeSizeProject/2/api/json?tree=artifacts[*]";
            var variables = {
                "endpoint": {
                    "url": "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080"
                },
                "definition": "ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/LargeSizeProject",
                "version": "2"
            };

            var handler = new BasicCredentialHandler(nconf.get('JENKINS:USERNAME'), nconf.get('JENKINS:PASSWORD'));
            var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "jenkinsDropWithLargeSizeFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    let fileTickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File && x.state === TicketState.Processed);
                    assert.strictEqual(fileTickets.length, 301);
                    assert(getDownloadSizeInMB(fileTickets) > 400);
                    done();
                }, (error) => {
                    throw error;
                });
        });

        //Artifact details => Source: Jenkins, FilesCount: 20377, DownloadSize: ~117MB, TotalFileSize: ~117MB
        it('should be able to download jenkins artifact with large volume of files', function (done) {
            this.timeout(1800000);  //30mins
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 4;
            processorOptions.verbose = true;

            var itemsUrl = "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080/job/ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/LargeVolumeProject/1/api/json?tree=artifacts[*]";
            var variables = {
                "endpoint": {
                    "url": "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080"
                },
                "definition": "ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/LargeVolumeProject",
                "version": "1"
            };

            var handler = new BasicCredentialHandler(nconf.get('JENKINS:USERNAME'), nconf.get('JENKINS:PASSWORD'));
            var webProvider = new providers.WebProvider(itemsUrl, "jenkins.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "jenkinsDropWithLargeVolumeFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    let fileTickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File && x.state === TicketState.Processed);
                    assert.strictEqual(fileTickets.length, 20377);
                    assert(getDownloadSizeInMB(fileTickets) > 20);
                    done();
                }, (error) => {
                    throw error;
                });
        });

        //Artifact details => Source: Jenkins, FilesCount: 20377, DownloadSize: ~117MB, TotalFileSize: ~117MB
        it('should be able to download jenkins artifact with large volume of files as zip', function (done) {
            this.timeout(60000);
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 2;
            processorOptions.verbose = true;

            var itemsUrl = "http://rmcdpjenkins3.southindia.cloudapp.azure.com:8080/job/ReleaseManagement/job/RMCDP/job/ArtifactEngineTests/job/LargeVolumeProject/1/artifact/*zip*/";
            var handler = new BasicCredentialHandler(nconf.get('JENKINS:USERNAME'), nconf.get('JENKINS:PASSWORD'));
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
    });
});

function getDownloadSizeInMB(fileTickets: ArtifactDownloadTicket[]): number {
    let totalDownloadSizeInBytes = 0;
    for (var ticket of fileTickets) {
        totalDownloadSizeInBytes += ticket.downloadSizeInBytes;
    }
    return totalDownloadSizeInBytes / (1024 * 1024);
}