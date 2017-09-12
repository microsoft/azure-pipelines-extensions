import * as path from 'path';
import * as fs from 'fs';

var minimatch = require('minimatch');

import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { ArtifactEngineOptions } from "./artifactEngineOptions"
import { Logger } from './logger';
import { TicketState } from '../Models/ticketState';

export class ArtifactEngine {
    async processItems(sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions): Promise<models.ArtifactDownloadTicket[]> {
        const processors: Promise<{}>[] = [];
        artifactEngineOptions = artifactEngineOptions || new ArtifactEngineOptions();
        this.logger = new Logger(artifactEngineOptions.verbose);
        this.artifactItemStore.flush();

        var startTime = new Date();

        const itemsToPull: models.ArtifactItem[] = await sourceProvider.getRootItems();
        this.artifactItemStore.addItems(itemsToPull);

        for (let i = 0; i < artifactEngineOptions.parallelProcessingLimit; ++i) {
            processors.push(new Promise(async (resolve, reject) => {
                await this.spawnWorker(resolve, reject, sourceProvider, destProvider, artifactEngineOptions);
            }));
        }

        var a = async () => setTimeout(() => {
            var itemsInQueue = this.artifactItemStore.getNumProcessingItems();

            var tickets = this.artifactItemStore.getTickets();
            var finishedItems = tickets.filter(x => x.state == TicketState.Processed || x.state == TicketState.Skipped || x.state == TicketState.Failed);
            var queuedItems = tickets.filter(x => x.state == TicketState.InQueue);
            var processingItems = tickets.filter(x => x.state == TicketState.Processing);
            var processedItems = tickets.filter(x => x.state == TicketState.Processed);
            var skippedItems = tickets.filter(x => x.state == TicketState.Skipped);
            var failedItems = tickets.filter(x => x.state == TicketState.Failed);
            var currentTime = new Date();

            console.log(
                "Total: " + tickets.length
                + ", Processed: " + processedItems.length
                + ", Processing: " + processingItems.length
                + ", Queued: " + queuedItems.length
                + ", Skipped: " + skippedItems.length
                + ", Failed: " + failedItems.length
                + ", Time elapsed: " + ((currentTime.valueOf() - startTime.valueOf()) / 1000) + "secs");

            if (itemsInQueue != 0) {
                a();
            }
        }, 1000);

        a();

        await Promise.all(processors);

        var endTime = new Date();

        console.log("Total time taken: " + ((endTime.valueOf() - startTime.valueOf()) / 1000) + "secs")

        this.logger.logSummary(this.artifactItemStore);

        var endTime2 = new Date();
        console.log("Time taken to print summary: " + ((endTime2.valueOf() - endTime.valueOf()) / 1000) + "secs")

        return this.artifactItemStore.getTickets();
    }

    async spawnWorker(resolve, reject, sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions) {
        try {
            await this.workerImplementation(sourceProvider, destProvider, artifactEngineOptions);
            if (this.artifactItemStore.getNumProcessingItems() == 0) {
                this.logger.logMessage("Exiting worker nothing more to process");
                resolve();
            }
            else {
                // spawn worker after 1 sec to check for items again.
                setTimeout(() => this.spawnWorker(resolve, reject, sourceProvider, destProvider, artifactEngineOptions), 1000);
            }
        }
        catch (err) {
            reject(err);
        }
    }
    async workerImplementation(sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions) {
        while (true) {
            const item = this.artifactItemStore.getNextItemToProcess();
            if (!item) {
                break;
            }

            this.logger.logInfo("Dequeued item " + item.path + " for processing.");
            await this.processArtifactItem(sourceProvider, item, destProvider, artifactEngineOptions);
        }
    }

    processArtifactItem(sourceProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions): Promise<{}> {
        return new Promise(async (downloadResolve, downloadReject) => {
            this.processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, downloadResolve, downloadReject);
        });
    }

    async processArtifactItemImplementation(sourceProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions,
        resolve,
        reject,
        retryCount?: number) {
        try {
            retryCount = retryCount ? retryCount : 0;
            if (item.itemType === models.ItemType.File) {
                if (minimatch(item.path, artifactEngineOptions.itemPattern, { dot: true })) {
                    this.logger.logInfo("Processing " + item.path);
                    const contentStream = await sourceProvider.getArtifactItem(item);
                    this.logger.logInfo("Got download stream for item: " + item.path);
                    await destProvider.putArtifactItem(item, contentStream);
                    this.artifactItemStore.updateState(item, models.TicketState.Processed);
                    resolve();
                }
                else {
                    this.logger.logInfo("Skipped processing item " + item.path);
                    this.artifactItemStore.updateState(item, models.TicketState.Skipped);
                    resolve();
                }
            }
            else {
                var items = await sourceProvider.getArtifactItems(item);
                items = items.map((value, index) => {
                    if (!value.path.toLowerCase().startsWith(item.path.toLowerCase())) {
                        value.path = path.join(item.path, value.path);
                    }

                    return value;
                });

                this.artifactItemStore.addItems(items);
                this.artifactItemStore.updateState(item, models.TicketState.Processed);

                this.logger.logInfo("Enqueued " + items.length + " for processing.");
                resolve();
            }
        } catch (err) {
            this.logger.logError("Error processing file " + item.path + ":" + err);
            if (retryCount === artifactEngineOptions.retryLimit - 1) {
                this.artifactItemStore.updateState(item, models.TicketState.Failed);
                reject(err);
            } else {
                setTimeout(() => this
                    .processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, resolve, reject, retryCount + 1), artifactEngineOptions.retryIntervalInSeconds * 1000);
            }
        }
    }

    private artifactItemStore: ArtifactItemStore = new ArtifactItemStore();
    private logger: Logger;
}