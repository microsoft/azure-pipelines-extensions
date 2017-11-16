import * as path from 'path';
import * as fs from 'fs';

var minimatch = require('minimatch');

import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { ArtifactEngineOptions } from "./artifactEngineOptions"
import { Logger } from './logger';
import { Worker } from './worker';
import { TicketState } from '../Models/ticketState';

export class ArtifactEngine {
    processItems(sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions): Promise<models.ArtifactDownloadTicket[]> {
        var downloadCompletePromise = new Promise<models.ArtifactDownloadTicket[]>((resolve, reject) => {
            const processors: Promise<void>[] = [];
            artifactEngineOptions = artifactEngineOptions || new ArtifactEngineOptions();
            this.artifactItemStore.flush();
            Logger.verbose = artifactEngineOptions.verbose;
            this.logger = new Logger(this.artifactItemStore);
            this.logger.logProgress();
            sourceProvider.getRootItems().then((itemsToPull: models.ArtifactItem[]) => {
                this.artifactItemStore.addItems(itemsToPull);

                for (let i = 0; i < artifactEngineOptions.parallelProcessingLimit; ++i) {
                    var worker = new Worker<models.ArtifactDownloadTicket>(i + 1, item => this.processArtifactItem(sourceProvider, item, destProvider, artifactEngineOptions), () => this.artifactItemStore.getNextItemToProcess(), () => !this.artifactItemStore.itemsPendingProcessing());
                    processors.push(worker.init());
                }

                var processorsPromise = Promise.all(processors);
                processorsPromise.then(() => {
                    this.logger.logSummary();
                    resolve(this.artifactItemStore._downloadTickets);
                }).catch((error) => {
                    reject(error);
                });
            }, (error) => {
                reject(error);
            });
        });

        return downloadCompletePromise;
    }

    processArtifactItem(sourceProvider: models.IArtifactProvider,
        ticket: models.ArtifactDownloadTicket,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions) {
        return new Promise<void>((resolve, reject) => {
            var retryCount = ticket.retryCount;
            if (ticket.artifactItem.itemType === models.ItemType.File) {
                if (minimatch(ticket.artifactItem.path, artifactEngineOptions.itemPattern, { dot: true, nocase: true })) {
                    Logger.logInfo("Processing " + ticket.artifactItem.path);
                    sourceProvider.getArtifactItem(ticket.artifactItem).then((stream) => {
                        Logger.logInfo("Got download stream for item: " + ticket.artifactItem.path);
                        var putArtifactItemPromise = destProvider.putArtifactItem(ticket.artifactItem, stream);
                        putArtifactItemPromise.catch((err) => { console.log(err); })
                        putArtifactItemPromise.then((item1) => {
                            this.artifactItemStore.updateState(item1, models.TicketState.Processed, retryCount);
                            resolve();
                        });
                    }, (err) => {
                        if (retryCount === artifactEngineOptions.retryLimit - 1) {
                            this.artifactItemStore.updateState(ticket.artifactItem, models.TicketState.Failed, retryCount);
                            reject(err);
                            return;
                        } else {
                            Logger.logError("Error processing file " + ticket.artifactItem.path + ":" + err);
                            this.artifactItemStore.updateState(ticket.artifactItem, models.TicketState.InQueue, retryCount + 1);

                            resolve();
                            return;
                        }
                    });
                }
                else {
                    Logger.logInfo("Skipped processing item " + ticket.artifactItem.path);
                    this.artifactItemStore.updateState(ticket.artifactItem, models.TicketState.Skipped, retryCount);
                    resolve();
                }
            }
            else {
                sourceProvider.getArtifactItems(ticket.artifactItem).then((items) => {
                    items = items.map((value, index) => {
                        if (!value.path.toLowerCase().startsWith(ticket.artifactItem.path.toLowerCase())) {
                            value.path = path.join(ticket.artifactItem.path, value.path);
                        }

                        return value;
                    });

                    this.artifactItemStore.addItems(items);
                    this.artifactItemStore.updateState(ticket.artifactItem, models.TicketState.Processed, retryCount);

                    Logger.logInfo("Enqueued " + items.length + " for processing.");
                    resolve();
                });
            }
        });
    }

    private artifactItemStore: ArtifactItemStore = new ArtifactItemStore();
    private logger: Logger;
}

process.removeAllListeners('unhandledRejection');
process.removeAllListeners('uncaughtException');
process.on('unhandledRejection', (err, promise) => {
    // ignore printing errors for timeout  
    if (err.code !== 'ETIMEDOUT') {
        console.error("Unhandled Rejection: " + err);
        //throw err;
    }
});

process.on('uncaughtException', function (err) {
    // ignore printing errors for timeout  
    if (err.code !== 'ETIMEDOUT') {
        console.error(err);
        throw err;
    }
});