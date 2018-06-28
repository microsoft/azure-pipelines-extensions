import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { resolve } from 'url';;
var crypto = require('crypto');

var tl = require('vsts-task-lib/task');

import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { Logger } from '../Engine/logger';

export class CacheProvider implements models.IArtifactProvider {

    public artifactItemStore: ArtifactItemStore;

    constructor(artifactCacheDirectory: string, artifactCacheHashKey: string, relPath?: string) {
        this.artifactCacheDirectory = artifactCacheDirectory ? artifactCacheDirectory : '';
        this.key = crypto.createHash('SHA256').update(artifactCacheHashKey ? artifactCacheHashKey : '').digest('hex');
        this.relPath = relPath ? relPath : '';
        this.cacheDirectory = path.join(this.artifactCacheDirectory, models.Constants.CacheFolder, this.key);
        this.cacheHashFilePath = path.join(this.cacheDirectory, models.Constants.MetadataFile);
        this.makeOldHash()
    }

    getRootItems(): Promise<models.ArtifactItem[]> {
        throw new Error("Not implemented");
    }

    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        throw new Error("Not implemented");
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            var pathInArtifactMetadata = path.normalize(artifactItem.path.substring(this.relPath.length + 1));
            if (artifactItem.fileHashInArtifactMetadata && artifactItem.fileHashInArtifactMetadata === this.filePathToFileHashMap[pathInArtifactMetadata]
                && fs.existsSync(path.join(this.artifactCacheDirectory, models.Constants.CacheFolder, this.key, pathInArtifactMetadata))) {
                const inputStream = fs.createReadStream(path.join(this.artifactCacheDirectory, models.Constants.CacheFolder, this.key, artifactItem.path.substring(this.relPath.length + 1)));
                inputStream.on('error', (err) => {
                    reject(err);
                });
                resolve(inputStream);
            }
            else {
                resolve(undefined);
            }
        });
        return promise;
    }

    public putArtifactItem(item: models.ArtifactItem, stream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        throw new Error("Not implemented");
    }

    public getRootLocation(): string {
        throw new Error("Not implemented");
    }

    public getRootItemPath(): string {
        throw new Error("Not implemented");
    }

    dispose(): void {
    }

    private makeOldHash(): void {
        if (fs.existsSync(path.join(this.artifactCacheDirectory, models.Constants.CacheFolder, this.key, "verify.json"))) {
            if (fs.existsSync(this.cacheHashFilePath)) {
                var oldHash = readline.createInterface({
                    input: fs.createReadStream(this.cacheHashFilePath)
                });

                oldHash.on('line', (line) => {
                    var words = line.split(',');
                    this.filePathToFileHashMap[words[0]] = words[1];
                });

                oldHash.on('close', () => {
                    Logger.logMessage(tl.loc("SuccessfulCaching"));
                });
            }
            else {
                this.filePathToFileHashMap = {};
                Logger.logMessage(tl.loc("NoMetadataFile"));
            }
        }
        else {
            this.filePathToFileHashMap = {}
            Logger.logMessage(tl.loc("NoCache"));
        }
    }

    public getCacheDirectory(): string {
        return this.cacheDirectory;
    }

    private cacheHashFilePath: string = "";
    private cacheDirectory: string;
    private filePathToFileHashMap = {};
    private artifactCacheDirectory: string;
    private key: string;
    private relPath: string;
}