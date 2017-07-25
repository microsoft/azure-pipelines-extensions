import * as path from 'path';
import * as fs from 'fs';

import * as minimatch from 'minimatch';

import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { FetchEngineOptions } from "./fetchEngineOptions"

export class FetchEngine {
    async fetchItems(artifactProvider: models.IArtifactProvider, targetPath: string, fetchEngineOptions: FetchEngineOptions): Promise<void> {
        const downloaders: Promise<{}>[] = [];
        const createdFolders: { [key: string]: boolean } = {};

        const itemsToDownload: models.ArtifactItem[] = await artifactProvider.getRootItems();
        this.artifactStore.addItems(itemsToDownload);

        for (let i = 0; i < fetchEngineOptions.parallelDownloadLimit; ++i) {
            downloaders.push(new Promise(async (resolve, reject) => {
                try {
                    while (true) {
                        const item = this.artifactStore.getNextItemToProcess();
                        if (!item) {
                            break;
                        }

                        console.log("Dequeued item " + item.path + " to download queue for processing.");
                        const outputFilename = path.join(targetPath, item.path);
                        const folder = path.dirname(outputFilename);
                        this.ensureDirectoryExistence(folder);

                        if (!createdFolders.hasOwnProperty(folder)) {
                            if (!fs.existsSync(folder)) {
                                fs.mkdir(folder);
                            }
                            createdFolders[folder] = true;
                        }

                        await this.downloadArtifactItem(artifactProvider, item, outputFilename, fetchEngineOptions.downloadPattern, fetchEngineOptions.retryLimit);
                    }

                    console.log("Exiting worker nothing more to process");

                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            }));
        }

        await Promise.all(downloaders);
    }

    downloadArtifactItem(artifactProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        outputFilename: string,
        downloadPattern: string,
        retryLimit: number,
        retryCount?: number): Promise<{}> {
        return new Promise(async (downloadResolve, downloadReject) => {
            try {
                retryCount = retryCount ? retryCount : 0;
                if (item.itemType === models.ItemType.File) {
                    if (minimatch(item.path, downloadPattern)) {
                        console.log("Downloading '%s' to '%s' (file %d of %d)", item.path, outputFilename);
                        const contentStream = await artifactProvider.getArtifactItem(item);
                        const outputStream = fs.createWriteStream(outputFilename);

                        contentStream.pipe(outputStream);
                        contentStream.on("end",
                            () => {
                                console.log(`Downloaded '${item.path}' to '${outputFilename}'`);
                                downloadResolve();
                            });
                    }
                    else {
                        console.log("Skipping download of file " + item.path);
                        downloadResolve();
                    }
                }
                else {
                    var items = await artifactProvider.getArtifactItems(item);
                    items = items.map((value, index) => {
                        if(!value.path.startsWith(item.path)){
                            value.path = path.join(item.path, value.path);
                        }

                        return value;
                    });

                    this.artifactStore.addItems(items);

                    console.log("Enqueued " + items.length + " to download queue for processing.");
                    downloadResolve();
                }
            } catch (err) {
                console.log("Error downloading file %s: %s", item.path, err);
                if (retryCount === retryLimit - 1) {
                    downloadReject(err);
                } else {
                    process.nextTick(() => this
                        .downloadArtifactItem(artifactProvider, item, outputFilename, downloadPattern, retryLimit, retryCount + 1));
                }
            }
        });
    }

    private ensureDirectoryExistence(filePath) {
        var dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
            return true;
        }
        this.ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }

    private artifactStore: ArtifactItemStore = new ArtifactItemStore();
}