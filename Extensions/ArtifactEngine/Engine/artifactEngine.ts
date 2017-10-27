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
    async processItems(sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions): Promise<models.ArtifactDownloadTicket[]> {
        const processors: Promise<void>[] = [];
        artifactEngineOptions = artifactEngineOptions || new ArtifactEngineOptions();
        this.artifactItemStore.flush();
        Logger.verbose = artifactEngineOptions.verbose;
        this.logger = new Logger(this.artifactItemStore);
        this.logger.logProgress();
        const itemsToPull: models.ArtifactItem[] = await sourceProvider.getRootItems();
        this.artifactItemStore.addItems(itemsToPull);

        for (let i = 0; i < artifactEngineOptions.parallelProcessingLimit; ++i) {
            var worker = new Worker<models.ArtifactItem>(i + 1, item => this.processArtifactItem(sourceProvider, item, destProvider, artifactEngineOptions), () => this.artifactItemStore.getNextItemToProcess(), () => !this.artifactItemStore.itemsPendingProcessing());
            processors.push(worker.init());
        }

        await Promise.all(processors);

        this.logger.logSummary();

        return this.artifactItemStore.getTickets();
    }

    processArtifactItem(sourceProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions): Promise<void> {
        return new Promise<void>(async (downloadResolve, downloadReject) => {
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
                if (minimatch(item.path, artifactEngineOptions.itemPattern, { dot: true, nocase: true })) {
                    Logger.logInfo("Processing " + item.path);
                    const contentStream = await sourceProvider.getArtifactItem(item);
                    Logger.logInfo("Got download stream for item: " + item.path);
                    await destProvider.putArtifactItem(item, contentStream);
                    this.artifactItemStore.updateState(item, models.TicketState.Processed);
                    resolve();
                }
                else {
                    Logger.logInfo("Skipped processing item " + item.path);
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

                Logger.logInfo("Enqueued " + items.length + " for processing.");
                resolve();
            }
        } catch (err) {
            Logger.logError("Error processing file " + item.path + ":" + err);
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

process.on('unhandledRejection', (reason, promise) => {
    console.error(reason);
    throw reason;
});