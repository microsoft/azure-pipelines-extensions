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

    constructor(artifactCacheDirectory: string, artifactCacheKey: string, relPath?: string) {
        this.artifactCacheDirectory = artifactCacheDirectory;
        this.key = crypto.createHash('SHA256').update(artifactCacheKey).digest('hex');
        this.relPath = relPath ? relPath : '';
        this.cacheDirectory = path.join(artifactCacheDirectory, models.Constants.CacheFolder, this.key);
        this.cacheHashPath = path.join(this.cacheDirectory, 'artifact-metadata.csv');
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
            if (artifactItem.fileHash && artifactItem.fileHash === this.oldFileHashMap[path.normalize(artifactItem.path.substring(this.relPath.length + 1))]
                && fs.existsSync(path.join(this.artifactCacheDirectory, models.Constants.CacheFolder, this.key, path.normalize(artifactItem.path.substring(this.relPath.length + 1))))) {
                const inputStream = fs.createReadStream(path.join(this.artifactCacheDirectory, models.Constants.CacheFolder, this.key, artifactItem.path.substring(this.relPath.length + 1)));
                inputStream.on('error', (err) => {
                    reject(err);
                })
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

    public makeOldHash(): void {
        if (fs.existsSync(path.join(this.artifactCacheDirectory, models.Constants.CacheFolder, this.key, "verify.json"))) {
            if (fs.existsSync(this.cacheHashPath)) {
                var oldHash = readline.createInterface({
                    input: fs.createReadStream(this.cacheHashPath)
                });

                oldHash.on('line', (line) => {
                    var words = line.split(',');
                    this.oldFileHashMap[words[0]] = words[1];
                });

                oldHash.on('close', () => {
                    Logger.logMessage(tl.loc("SuccessfulCaching"))
                });
            }
            else {
                this.oldFileHashMap = {};
                Logger.logMessage(tl.loc("NoMetadataFile"))
            }
        }
        else {
            this.oldFileHashMap = {}
            Logger.logMessage(tl.loc("NoCache"));
        }
    }

    public getCacheDirectory(): string {
        return this.cacheDirectory;
    }

    private cacheHashPath: string = "";
    private cacheDirectory: string;
    private oldFileHashMap = {};
    private artifactCacheDirectory: string;
    private key: string;
    private relPath: string;
}