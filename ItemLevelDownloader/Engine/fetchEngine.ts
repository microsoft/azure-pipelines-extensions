import * as path from 'path';
import * as fs from 'fs';

import * as models from "../Models"
import {FetchEngineOptions} from "./fetchEngineOptions"

export class FetchEngine {
    async fetchItems(artifactProvider: models.IArtifactProvider, targetPath: string, fetchEngineOptions: FetchEngineOptions): Promise<void> {
        const items: models.ArtifactItem[] = await artifactProvider.getArtifactItems();

        let maxConcurrency = Math.min(fetchEngineOptions.parallelDownloadLimit, items.length);
        let fileCount: number = items.length;
        let downloaders: Promise<{}>[] = [];
        let createdFolders: { [key: string]: boolean } = {};
        for (let i = 0; i < maxConcurrency; ++i) {
            downloaders.push(new Promise(async (resolve, reject) => {
                try {
                    while (items.length > 0) {
                        let item = items.pop();
                        let fileIndex = fileCount - items.length;

                        // the full path of the downloaded file
                        let outputFilename = path.join(targetPath, item.path);

                        // create the folder if necessary
                        let folder = path.dirname(outputFilename);
                        if (!createdFolders.hasOwnProperty(folder)) {
                            if (!fs.exists(folder)) {
                                fs.mkdir(folder);
                            }
                            createdFolders[folder] = true;
                        }

                        this.logProgressFilename(item.path, outputFilename, fileIndex, fileCount);
                        await new Promise(async (downloadResolve, downloadReject) => {
                            try {
                                // get the content stream from the provider
                                let contentStream = await artifactProvider.getArtifactItem(item);

                                // create the target stream
                                let outputStream = fs.createWriteStream(outputFilename);

                                // pipe the content to the target
                                contentStream.pipe(outputStream);
                                contentStream.on('end', () => {
                                    console.log(`Downloaded '${item.path}' to '${outputFilename}'`);
                                    downloadResolve();
                                });
                            }
                            catch (err) {
                                console.log("Error downloading file %s", item.path);
                                downloadReject(err);
                            }
                        });
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

    logProgressFilename(relativePath: string, outputFilename: string, fileIndex: number, fileCount: number): void {
        console.log("Downloading '%s' to '%s' (file %d of %d)", relativePath, outputFilename, fileIndex, fileCount);
    }
}