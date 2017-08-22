import { setTimeout } from 'timers';
import * as path from 'path';
import * as fs from 'fs';

var minimatch = require('minimatch');

import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { ArtifactEngineOptions } from "./artifactEngineOptions"

export class ArtifactEngine {
    async processItems(sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions): Promise<void> {
        const processors: Promise<{}>[] = [];
        artifactEngineOptions = artifactEngineOptions || new ArtifactEngineOptions();
        this.artifactItemStore.flush();

        const itemsToPull: models.ArtifactItem[] = await sourceProvider.getRootItems();
        this.artifactItemStore.addItems(itemsToPull);

        for (let i = 0; i < artifactEngineOptions.parallelProcessingLimit; ++i) {
            processors.push(new Promise(async (resolve, reject) => {
                try {
                    while (true) {
                        const item = this.artifactItemStore.getNextItemToProcess();
                        if (!item) {
                            break;
                        }

                        console.log("Dequeued item " + item.path + " for processing.");
                        await this.processArtifactItem(sourceProvider, item, destProvider, artifactEngineOptions);
                    }

                    console.log("Exiting worker nothing more to process");

                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            }));
        }

        await Promise.all(processors);
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
                if (minimatch(item.path, artifactEngineOptions.itemPattern)) {
                    console.log("Processing '%s'", item.path);
                    const contentStream = await sourceProvider.getArtifactItem(item);
                    console.log("got read stream for item: " + item.path);
                    await destProvider.putArtifactItem(item, contentStream);
                    resolve();
                }
                else {
                    console.log("Skipped processing item " + item.path);
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

                console.log("Enqueued " + items.length + " for processing.");
                resolve();
            }
        } catch (err) {
            console.log("Error processing file %s: %s", item.path, err);
            if (retryCount === artifactEngineOptions.retryLimit - 1) {
                reject(err);
            } else {
                setTimeout(() => this
                    .processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, resolve, reject, retryCount + 1), artifactEngineOptions.retryIntervalInSeconds * 1000);
            }
        }
    }

    private artifactItemStore: ArtifactItemStore = new ArtifactItemStore();
}