import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline'
import { resolve } from 'url';
var tl = require('vsts-task-lib/task');



export class CacheProvider {
    
    constructor(key: string) {
        // change "C:/vsts-agent/_layout/_work" by tl.getVariable("AGENT_WORKFOLDER")
        this.cacheHashPath = path.join("C:/vsts-agent/_layout/_work", "ArtifactEngineCache", key, 'artifact-metadata.csv');
    }

    public makeOldHash() : Promise<Object>  {
        return new Promise((resolve) => {
            var oldHash = readline.createInterface ({
                input : fs.createReadStream(this.cacheHashPath)
            });
    
            oldHash.on('line', (line) => {
                var words = line.split(',');
                this.oldFileHashMap[words[0]] = words[1];
            });

            oldHash.on('close', () => {
                resolve(this.oldFileHashMap);
            });
        });
    }

    private cacheHashPath : string = "";
    private oldFileHashMap = {};

}