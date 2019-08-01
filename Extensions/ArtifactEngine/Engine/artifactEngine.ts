import * as path from 'path';

var tl = require('azure-pipelines-task-lib/task');

import * as models from '../Models';
import * as ci from './cilogger';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { ArtifactEngineOptions } from "./artifactEngineOptions"
import { Logger } from './logger';
import { Worker } from './worker';

export class ArtifactEngine {
    processItems(sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions): Promise<models.ArtifactDownloadTicket[]> {
        var artifactDownloadTicketsPromise = new Promise<models.ArtifactDownloadTicket[]>((resolve, reject) => {
            const workers: Promise<void>[] = [];
            artifactEngineOptions = artifactEngineOptions || new ArtifactEngineOptions();
            this.createPatternList(artifactEngineOptions);
            this.artifactItemStore.flush();
            Logger.verbose = artifactEngineOptions.verbose;
            this.logger = new Logger(this.artifactItemStore);
            this.logger.logProgress();
            sourceProvider.artifactItemStore = this.artifactItemStore;
            destProvider.artifactItemStore = this.artifactItemStore;
            sourceProvider.getRootItems().then((itemsToProcess: models.ArtifactItem[]) => {
                this.artifactItemStore.addItems(itemsToProcess);

                for (let i = 0; i < artifactEngineOptions.parallelProcessingLimit; ++i) {
                    var worker = new Worker<models.ArtifactItem>(i + 1, item => this.processArtifactItem(sourceProvider, item, destProvider, artifactEngineOptions), () => this.artifactItemStore.getNextItemToProcess(), () => !this.artifactItemStore.itemsPendingProcessing(), () => this.artifactItemStore.hasDownloadFailed());
                    workers.push(worker.init());
                }

                Promise.all(workers).then(() => {
                    this.logger.logSummary();
                    sourceProvider.dispose();
                    destProvider.dispose();
                    resolve(this.artifactItemStore.getTickets());
                }, (err) => {
                    ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'error', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
                    sourceProvider.dispose();
                    destProvider.dispose();
                    reject(err);
                });
            }, (err) => {
                ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'error', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
                sourceProvider.dispose();
                destProvider.dispose();
                reject(err);
            });
        });

        return artifactDownloadTicketsPromise;
    }

    processArtifactItem(sourceProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, resolve, reject);
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
                this.artifactItemStore.updateState(item, models.TicketState.Failed);
                reject(err);
            } else {
                this.artifactItemStore.increaseRetryCount(item);
                Logger.logMessage(tl.loc("RetryingDownload", item.path, (retryCount + 1)));
                setTimeout(() => this
                    .processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, resolve, reject, retryCount + 1), (artifactEngineOptions.retryIntervalInSeconds * (3 ^ (retryCount + 1)) * 1000));
            }
        }
        retryCount = retryCount ? retryCount : 0;
        if (item.itemType === models.ItemType.File) {
            var pathToMatch = item.path.replace(/\\/g, '/');
            var matchOptions = {
                debug: false,
                nobrace: true,
                noglobstar: false,
                dot: true,
                noext: false,
                nocase: false,
                nonull: false,
                matchBase: false,
                nocomment: false,
                nonegate: false,
                flipNegate: false
            };

            if (tl.match([pathToMatch], this.patternList, null, matchOptions).length > 0) {
                Logger.logInfo("Processing " + item.path);
                sourceProvider.getArtifactItem(item).then((contentStream) => {
                    Logger.logInfo("Got download stream for item: " + item.path);
                    destProvider.putArtifactItem(item, contentStream)
                        .then((item) => {
                            this.artifactItemStore.updateState(item, models.TicketState.Processed);
                            resolve();
                        }, (err) => {
                            Logger.logInfo("Error placing file " + item.path + ": " + err);
                            retryIfRequired(err);
                        });
                }, (err) => {
                    Logger.logInfo("Error getting file " + item.path + ": " + err);
                    retryIfRequired(err);
                });
            }
            else {
                Logger.logMessage(tl.loc("SkippingItem", pathToMatch));
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
                });

                if (items.length > 0) {
                    this.artifactItemStore.addItems(items);
                    this.artifactItemStore.updateState(item, models.TicketState.Processed);
                }
                else {
                    destProvider.putArtifactItem(item, null)
                        .then((item) => {
                            this.artifactItemStore.updateState(item, models.TicketState.Processed);
                            resolve();
                        }, (err) => {
                            Logger.logInfo("Error creating folder " + item.path + ": " + err);
                            retryIfRequired(err);
                        });
                }

                Logger.logInfo("Enqueued " + items.length + " for processing.");
                resolve();
            }, (err) => {
                Logger.logInfo("Error getting " + item.path + ":" + err);
                retryIfRequired(err);
            });
        }
    }

    createPatternList(artifactEngineOptions: ArtifactEngineOptions) {
        if (!artifactEngineOptions.itemPattern) {
            this.patternList = ['**'];
        }
        else {
            this.patternList = artifactEngineOptions.itemPattern.split('\n');
        }
    }

    private artifactItemStore: ArtifactItemStore = new ArtifactItemStore();
    private logger: Logger;
    private patternList: string[];
}

tl.setResourcePath(path.join(path.dirname(__dirname), 'lib.json'));
process.on('unhandledRejection', (err) => {
    ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'unhandledRejection', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
    Logger.logError(tl.loc("UnhandledRejection", err));
    throw err;
});

process.on('uncaughtException', (err) => {
    ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'uncaughtException', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
    Logger.logError(tl.loc("UnhandledException", err));
    throw err;
});