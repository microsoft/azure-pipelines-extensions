import * as assert from 'assert';
import * as path from 'path'

import * as engine from "../Engine"
import * as providers from "../Providers"

import { TicketState } from '../Models/ticketState';
import { ItemType } from '../Models/itemType';
import { ArtifactDownloadTicket } from '../Models/artifactDownloadTicket';

var nconf = require('nconf');

nconf.argv()
    .env()
    .file(__dirname + '/../test.config.json');

describe('Perf Tests', () => {
    describe('fileshare perf tests', () => {
        var runWindowsBasedTest = process.platform == 'win32' ? it : it.skip;
        //Artifact details => Source: FileShare, FilesCount: 301, TotalFileSize: 1.7GB
        runWindowsBasedTest('should be able to download large size build artifact from fileshare', function (done) {
            this.timeout(900000);   //15mins
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 64;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 4;
            processorOptions.verbose = true;

            var itemsUrl = "//vscsstor/Users/gykuma/ArtifactEngineTestData/LargeSizeFiles/";

            var sourceProvider = new providers.FilesystemProvider(itemsUrl);
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "fileshareWithLargeSizeFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(sourceProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    let fileTickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File && x.state === TicketState.Processed);
                    assert.equal(fileTickets.length, 301);
                    assert(getDownloadSizeInMB(fileTickets) > 900);
                    done();
                }, (error) => {
                    throw error;
                });
        });

        //Artifact details => Source: FileShare, FilesCount: 4037, TotalFileSize: ~18MB
        runWindowsBasedTest('should be able to download build artifact with large volume of files from fileshare', function (done) {
            this.timeout(3000000);  //50mins
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 64;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 4;
            processorOptions.verbose = true;

            var itemsUrl = "//vscsstor/Users/gykuma/ArtifactEngineTestData/LargeFilesCount/";

            var sourceProvider = new providers.FilesystemProvider(itemsUrl);
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "fileshareWithLargeVolumeFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(sourceProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    let fileTickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File && x.state === TicketState.Processed);
                    assert.equal(fileTickets.length, 4037);
                    assert(getDownloadSizeInMB(fileTickets) > 15);
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