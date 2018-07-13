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
import { ArtifactDownloadTicket } from '../Models/artifactDownloadTicket';

var nconf = require('nconf');

nconf.argv()
    .env()
    .file(__dirname + '/../test.config.json');

describe('Perf Tests', () => {
    describe('vsts perf tests', () => {
        //Artifact details => Source: BuildContainer, FilesCount: 301, DownloadSize: ~545MB  TotalFileSize: ~1.7GB
        it('should be able to download large size build artifact from vsts drop', function (done) {
            this.timeout(300000);   //5mins
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 8;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 4;
            processorOptions.verbose = true;

            var itemsUrl = "https://testking123.visualstudio.com/_apis/resources/Containers/1902716?itemPath=largedrop&isShallow=false";
            var variables = {};

            var handler = new PersonalAccessTokenCredentialHandler(nconf.get('VSTS:PAT'));
            var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "vstsDropWithLargeFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    let fileTickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File && x.state === TicketState.Processed);
                    assert.equal(fileTickets.length, 301);
                    assert(getDownloadSizeInMB(fileTickets) > 400);
                    done();
                }, (error) => {
                    throw error;
                });
        });

        //Artifact details => Source: BuildContainer, FilesCount: 20391, DownloadSize: ~23MB, TotalFileSize: ~99MB
        it('should be able to download build artifact with large volume of files from vsts drop', function (done) {
            this.timeout(1800000);  //30mins
            let processor = new engine.ArtifactEngine();

            let processorOptions = new engine.ArtifactEngineOptions();
            processorOptions.itemPattern = "**";
            processorOptions.parallelProcessingLimit = 64;
            processorOptions.retryIntervalInSeconds = 2;
            processorOptions.retryLimit = 4;
            processorOptions.verbose = true;

            var itemsUrl = "https://testking123.visualstudio.com/_apis/resources/Containers/1976011?itemPath=files20k&isShallow=false";
            var variables = {};

            var handler = new PersonalAccessTokenCredentialHandler(nconf.get('VSTS:PAT'));
            var webProvider = new providers.WebProvider(itemsUrl, "vsts.handlebars", variables, handler, { ignoreSslError: false });
            var dropLocation = path.join(nconf.get('DROPLOCATION'), "vstsDropWithLargeFiles");
            var filesystemProvider = new providers.FilesystemProvider(dropLocation);

            processor.processItems(webProvider, filesystemProvider, processorOptions)
                .then((tickets) => {
                    let fileTickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File && x.state === TicketState.Processed);
                    assert.equal(fileTickets.length, 20391);
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