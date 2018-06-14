import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline'
import { resolve } from 'url';
import * as models from '../Models';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { Logger } from '../Engine/logger';

var tl = require('vsts-task-lib/task');



export class CacheProvider implements models.IArtifactProvider {

    public artifactItemStore: ArtifactItemStore;
    
    constructor(artifactCacheDirectory: string, key: string, relPath?: string) {
        this.artifactCacheDirectory = artifactCacheDirectory;
        this.key = key;
        this.relPath = relPath ? relPath : '';
        this.cacheHashPath = path.join(artifactCacheDirectory, "ArtifactEngineCache", key, 'artifact-metadata.csv');
        this.makeOldHash()
    }

    // throw new Error("Not implemented");
    getRootItems(): Promise<models.ArtifactItem[]> {
        throw new Error("Not implemented");
    }

    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        throw new Error("Not implemented");
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream> ((resolve,reject) => {
            if(this.relPath) {
                if(artifactItem.fileHash && artifactItem.fileHash === this.oldFileHashMap[artifactItem.path.substring(artifactItem.path.indexOf('\\')+1)]) {
                    const inputStream = fs.createReadStream(path.join(this.artifactCacheDirectory,"ArtifactEngineCache", this.key, artifactItem.path.substring(artifactItem.path.indexOf('\\')+1)));
                    resolve(inputStream);
                }
                else {
                    resolve(undefined);
                }
            }
            else {
                if(artifactItem.fileHash && artifactItem.fileHash === this.oldFileHashMap[artifactItem.path]) {
                    const inputStream = fs.createReadStream(path.join(this.artifactCacheDirectory,"ArtifactEngineCache", this.key, artifactItem.path));
                    resolve(inputStream);
                }
                else {
                    resolve(undefined);
                }
            }
            
        });
        return promise;
    }

    public putArtifactItem(item: models.ArtifactItem, stream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        throw new Error("Not implemented");
    }

    public getDestination(): Promise<string> {
        throw new Error("Not implemented");
    }

    public getRelativePath(): Promise<string> {
        throw new Error("Not implemented");
    }

    dispose(): void {
    }
    
    public makeOldHash() : void  {
        if(fs.existsSync(path.join(this.artifactCacheDirectory,"ArtifactEngineCache",this.key,"verify.txt"))) {
            if(fs.existsSync(this.cacheHashPath)) {
                var oldHash = readline.createInterface ({
                    input : fs.createReadStream(this.cacheHashPath)
                });
        
                oldHash.on('line', (line) => {
                    var words = line.split(',');
                    this.oldFileHashMap[words[0]] = words[1];
                });
        
                oldHash.on('close', () => {
                    
                });
            }
            else {
                this.oldFileHashMap = {};
                Logger.logMessage("artifact-metadata.csv not found")
            }
        }
        else {
            this.oldFileHashMap = {}
            Logger.logMessage("Cache is not verified or present");
        }
        
    }

    private cacheHashPath : string = "";
    private oldFileHashMap = {};
    private artifactCacheDirectory: string;
    private key: string;
    private relPath: string;

}