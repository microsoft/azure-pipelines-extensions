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
        var promise = new Promise<models.ArtifactDownloadTicket[]>((resolve, reject) => {
            const processors: Promise<void>[] = [];
            artifactEngineOptions = artifactEngineOptions || new ArtifactEngineOptions();
            this.artifactItemStore.flush();
            Logger.verbose = artifactEngineOptions.verbose;
            this.logger = new Logger(this.artifactItemStore);
            this.logger.logProgress();
            sourceProvider.getRootItems().then((itemsToPull: models.ArtifactItem[]) => {
                this.artifactItemStore.addItems(itemsToPull);

                for (let i = 0; i < artifactEngineOptions.parallelProcessingLimit; ++i) {
                    var worker = new Worker<models.ArtifactItem>(i + 1, item => this.processArtifactItem(sourceProvider, item, destProvider, artifactEngineOptions), () => this.artifactItemStore.getNextItemToProcess(), () => !this.artifactItemStore.itemsPendingProcessing());
                    processors.push(worker.init());
                }

                Promise.all(processors).then(() => {
                    this.logger.logSummary();
                    resolve(this.artifactItemStore.getTickets());
                }, (err) => {
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
        });

        return promise;
    }

    processArtifactItem(sourceProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions): Promise<void> {
        return new Promise<void>((downloadResolve, downloadReject) => {
            this.processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, downloadResolve, downloadReject);
        });
    }

    processArtifactItemImplementation(sourceProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions,
        resolve,
        reject,
        retryCount?: number) {
        var retryIfRequired = (err) => {
            if (retryCount === artifactEngineOptions.retryLimit - 1) {
                Logger.logError(err);
                this.artifactItemStore.updateState(item, models.TicketState.Failed);
                reject(err);
            } else {
                Logger.logMessage(err);
                this.artifactItemStore.increaseRetryCount(item);
                setTimeout(() => this
                    .processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, resolve, reject, retryCount + 1), artifactEngineOptions.retryIntervalInSeconds * 1000);
            }
        }
        retryCount = retryCount ? retryCount : 0;
        if (item.itemType === models.ItemType.File) {
            if (minimatch(item.path, artifactEngineOptions.itemPattern, { dot: true, nocase: true })) {
                Logger.logInfo("Processing " + item.path);
                sourceProvider.getArtifactItem(item).then((contentStream) => {
                    Logger.logInfo("Got download stream for item: " + item.path);
                    destProvider.putArtifactItem(item, contentStream).then((item) => {
                        this.artifactItemStore.updateState(item, models.TicketState.Processed);
                        resolve();
                    }, (err) => {
                        retryIfRequired("Error putting file " + item.path + ":" + err);
                    });
                }, (err) => {
                    retryIfRequired("Error getting file " + item.path + ":" + err);
                });
            }
            else {
                Logger.logInfo("Skipped processing item " + item.path);
                this.artifactItemStore.updateState(item, models.TicketState.Skipped);
                resolve();
            }
        }
        else {
            sourceProvider.getArtifactItems(item).then((items: models.ArtifactItem[]) => {
                items = items.map((value, index) => {
                    if (!value.path.toLowerCase().startsWith(item.path.toLowerCase())) {
                        value.path = path.join(item.path, value.path);
                    }

                    return value;
                }, (err) => {
                    retryIfRequired("Error getting " + item.path + ":" + err);
                });

                this.artifactItemStore.addItems(items);
                this.artifactItemStore.updateState(item, models.TicketState.Processed);

                Logger.logInfo("Enqueued " + items.length + " for processing.");
                resolve();
            });
        }
    }

    private artifactItemStore: ArtifactItemStore = new ArtifactItemStore();
    private logger: Logger;
}

process.on('unhandledRejection', (reason) => {
    Logger.logError(reason);
    throw reason;
});

process.on('uncaughtException', (reason) => {
    Logger.logError(reason);
    throw reason;
});