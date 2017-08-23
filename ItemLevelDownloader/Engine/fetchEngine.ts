import * as path from 'path';
import * as fs from 'fs';

var minimatch = require('minimatch');

import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { FetchEngineOptions } from "./fetchEngineOptions"

export class FetchEngine {
    async fetchItems(artifactProvider: models.IArtifactProvider, targetPath: string, fetchEngineOptions: FetchEngineOptions): Promise<void> {
        const downloaders: Promise<{}>[] = [];
        const createdFolders: { [key: string]: boolean } = {};

        const itemsToDownload: models.ArtifactItem[] = await artifactProvider.getRootItems();
        this.artifactItemStore.addItems(itemsToDownload);

        for (let i = 0; i < fetchEngineOptions.parallelDownloadLimit; ++i) {
            downloaders.push(new Promise(async (resolve, reject) => {
                try {
                    while (true) {
                        const item = this.artifactItemStore.getNextItemToProcess();
                        if (!item) {
                            break;
                        }

                        console.log("Dequeued item " + item.path + " from download queue for processing.");
                        const targetItemPath = path.join(targetPath, item.path);
                        const targetItemFolder = path.dirname(targetItemPath);
                        this.ensureParentFoldersExist(targetItemFolder);

                        if (!createdFolders.hasOwnProperty(targetItemFolder)) {
                            if (!fs.existsSync(targetItemFolder)) {
                                fs.mkdirSync(targetItemFolder);
                            }
                            createdFolders[targetItemFolder] = true;
                        }

                        await this.downloadArtifactItem(artifactProvider, item, targetItemPath, fetchEngineOptions);
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
        targetItemPath: string,
        fetchEngineOptions: FetchEngineOptions): Promise<{}> {
        return new Promise(async (downloadResolve, downloadReject) => {
            this.downloadArtifactItemImplementation(artifactProvider, item, targetItemPath, fetchEngineOptions, downloadResolve, downloadReject);
        });
    }

    async downloadArtifactItemImplementation(artifactProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        targetItemPath: string,
        fetchEngineOptions: FetchEngineOptions,
        downloadResolve,
        downloadReject,
        retryCount?: number) {
        try {
            retryCount = retryCount ? retryCount : 0;
            if (item.itemType === models.ItemType.File) {
                if (minimatch(item.path, fetchEngineOptions.itemPattern)) {
                    console.log("Downloading '%s' to '%s'", item.path, targetItemPath);
                    const contentStream = await artifactProvider.getArtifactItem(item);
                    const outputStream = fs.createWriteStream(targetItemPath);

                    contentStream.pipe(outputStream);
                    contentStream.on("end",
                        () => {
                            console.log(`Downloaded '${item.path}' to '${targetItemPath}'`);
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
                    if (!value.path.toLowerCase().startsWith(item.path.toLowerCase())) {
                        value.path = path.join(item.path, value.path);
                    }

                    return value;
                });

                this.artifactItemStore.addItems(items);

                console.log("Enqueued " + items.length + " to download queue for processing.");
                downloadResolve();
            }
        } catch (err) {
            console.log("Error downloading file %s: %s", item.path, err);
            if (retryCount === fetchEngineOptions.retryLimit - 1) {
                downloadReject(err);
            } else {
                setTimeout(() => this
                    .downloadArtifactItemImplementation(artifactProvider, item, targetItemPath, fetchEngineOptions, downloadResolve, downloadReject, retryCount + 1), fetchEngineOptions.retryIntervalInSeconds * 1000);
            }
        }
    }

    private ensureParentFoldersExist(filePath) {
        var dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
            return true;
        }
        this.ensureParentFoldersExist(dirname);
        fs.mkdirSync(dirname);
    }

    private artifactItemStore: ArtifactItemStore = new ArtifactItemStore();
}