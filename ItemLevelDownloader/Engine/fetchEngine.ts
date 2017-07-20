import * as path from 'path';
import * as fs from 'fs';

import * as minimatch from 'minimatch'

import * as models from "../Models"
import {FetchEngineOptions} from "./fetchEngineOptions"

export class FetchEngine {
    async fetchItems(artifactProvider: models.IArtifactProvider, targetPath: string, fetchEngineOptions: FetchEngineOptions): Promise<void> {
        const downloaders: Promise<{}>[] = [];
        const createdFolders: { [key: string]: boolean } = {};

        const items: models.ArtifactItem[] = await artifactProvider.getArtifactItems();
        const itemsToDownload: models.ArtifactItem[] = items.filter(item => minimatch(item.path, fetchEngineOptions.downloadPattern));
        const fileCount: number = itemsToDownload.length;
        const maxConcurrency = Math.min(fetchEngineOptions.parallelDownloadLimit, fileCount);

        for (let i = 0; i < maxConcurrency; ++i) {
            downloaders.push(new Promise(async (resolve, reject) => {
                try {
                    while (itemsToDownload.length > 0) {
                        const item = itemsToDownload.pop();
                        const fileIndex = fileCount - itemsToDownload.length;
                        const outputFilename = path.join(targetPath, item.path);
                        const folder = path.dirname(outputFilename);

                        if (!createdFolders.hasOwnProperty(folder)) {
                            if (!fs.existsSync(folder)) {
                                fs.mkdir(folder);
                            }
                            createdFolders[folder] = true;
                        }

                        this.logProgress(item.path, outputFilename, fileIndex, fileCount);
                        await this.downloadArtifactItem(artifactProvider, item, outputFilename, 2);
                    }

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
        retryLimit: number,
        retryCount?: number): Promise<{}> {
        return new Promise(async (downloadResolve, downloadReject) => {
            try {
                retryCount = retryCount ? retryCount : 0;
                const contentStream = await artifactProvider.getArtifactItem(item);
                const outputStream = fs.createWriteStream(outputFilename);

                contentStream.pipe(outputStream);
                contentStream.on("end",
                    () => {
                        console.log(`Downloaded '${item.path}' to '${outputFilename}'`);
                        downloadResolve();
                    });
            } catch (err) {
                console.log("Error downloading file %s: %s", item.path, err);
                if (retryCount === retryLimit - 1) {
                    downloadReject(err);
                } else {
                    process.nextTick(() => this
                        .downloadArtifactItem(artifactProvider, item, outputFilename, retryLimit, retryCount + 1));
                }
            }
        });
    }

    logProgress(relativePath: string, outputFilename: string, fileIndex: number, fileCount: number): void {
        console.log("Downloading '%s' to '%s' (file %d of %d)", relativePath, outputFilename, fileIndex, fileCount);
    }
}