import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline'

var tl = require('vsts-task-lib/task');
var minimatch = require('minimatch');
var nconf = require('nconf');
var crypto = require('crypto');
var q = require('q');

import * as models from '../Models';
import * as ci from './cilogger';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { ArtifactEngineOptions } from "./artifactEngineOptions"
import { Logger } from './logger';
import { Worker } from './worker';
import { TicketState } from '../Models/ticketState';
import { CacheProvider } from '../Providers/cacheProvider';
import { WriteStream } from 'tty';

export class ArtifactEngine {
    processItems(sourceProvider: models.IArtifactProvider, destProvider: models.IArtifactProvider, artifactEngineOptions?: ArtifactEngineOptions): Promise<models.ArtifactDownloadTicket[]> {
        var artifactDownloadTicketsPromise = new Promise<models.ArtifactDownloadTicket[]>((resolve, reject) => {
            const workers: Promise<void>[] = [];
            artifactEngineOptions = artifactEngineOptions || new ArtifactEngineOptions();
            artifactEngineOptions.cacheDirectory = artifactEngineOptions.cacheDirectory ? artifactEngineOptions.cacheDirectory : tl.getVariable("AGENT_WORKFOLDER");
            this.createPatternList(artifactEngineOptions);
            this.artifactItemStore.flush();
            Logger.verbose = artifactEngineOptions.verbose;
            this.logger = new Logger(this.artifactItemStore);
            this.logger.logProgress();
            sourceProvider.artifactItemStore = this.artifactItemStore;
            destProvider.artifactItemStore = this.artifactItemStore;
            sourceProvider.getRootItems().then((itemsToProcess: models.ArtifactItem[]) => {
                this.artifactItemStore.addItems(itemsToProcess,{});

                var resolveHashMaps = new Promise((resolve, reject) => {
                    sourceProvider.getArtifactItems(itemsToProcess[0]).then((items: models.ArtifactItem[]) => {
                        sourceProvider.getArtifactItem(items.find(x => x.path === require('path').join(itemsToProcess[0].path, 'artifact-metadata.csv') )).then((hashStream : NodeJS.ReadableStream) => {
                            
                            
                            var newHashPromise = new Promise((resolve) => {
                                var newHash = readline.createInterface ({
                                    input : hashStream
                                });
                        
                                newHash.on('line', (line) => {
                                    var words = line.split(',');
                                    this.newHashMap[words[0]] = words[1];
                                });
                    
                                newHash.on('close', () => {
                                    resolve();
                                });
                            });
                            newHashPromise.then(() => {
                                var key = crypto.createHash('SHA256').update(artifactEngineOptions.uniqueUrl).digest('hex');
                                // change "C:/vsts-agent/_layout/_work" by tl.getVariable("AGENT_WORKFOLDER")
                                if(fs.existsSync(path.join(artifactEngineOptions.cacheDirectory,"ArtifactEngineCache", key,'verify.txt'))) {
                                        var cacheProvider : CacheProvider = new CacheProvider(key);
                                        cacheProvider.makeOldHash().then((res) => {
                                        this.oldHashMap = res;                                
                                        resolve();
                                        });
                                }
                                else {
                                    Logger.logMessage("Cache is not verified or is not present.");
                                    resolve();
                                }                                    
                            });                            
                        }, (err) => {
                            Logger.logError(err);
                            reject(err);
                        });
                    }, (err) => {
                        Logger.logError(err);
                        reject(err);
                    });
                });

                resolveHashMaps.then(() => {
                    for (let i = 0; i < artifactEngineOptions.parallelProcessingLimit; ++i) {
                        var worker = new Worker<models.ArtifactItem>(i + 1, item => this.processArtifactItem(sourceProvider, item, destProvider, artifactEngineOptions), () => this.artifactItemStore.getNextItemToProcess(), () => !this.artifactItemStore.itemsPendingProcessing());
                        workers.push(worker.init());
                    }
        
                    Promise.all(workers).then(() => {
                        this.logger.logSummary();
                        
                        destProvider.getDestination().then((destination) => {
                            sourceProvider.getRelativePath().then((relPath) => {
                                var key = crypto.createHash('SHA256').update(artifactEngineOptions.uniqueUrl).digest('hex');
                                // change "C:/vsts-agent/_layout/_work" by tl.getVariable("AGENT_WORKFOLDER")
                                var cachePath = path.join(artifactEngineOptions.cacheDirectory, "ArtifactEngineCache", key);
                                if(fs.existsSync(cachePath))
                                    this.deleteFolderRecursive(cachePath);
                                var self = this;
                                this.walk(path.join(destination,relPath), function (err, result) {                                                                        
                                    if (err)
                                        throw err;
                                    else {
                                        var arr2 = [];
                                        if(!fs.existsSync(path.dirname(cachePath)))
                                            fs.mkdirSync(path.dirname(cachePath));
                                        fs.mkdirSync(cachePath); 
                                        var dirtyCache = 0;                                                                            
                                        result.forEach(function (file) {                                         
                                            var fileRelativePath = file.substring(path.join(destination,relPath,'/').length);
                                            var fileCachePath = path.join(cachePath,fileRelativePath);
                                            if(!fs.existsSync(path.dirname(fileCachePath))) {                                
                                                fs.mkdirSync(path.dirname(fileCachePath))
                                            } 
                                              
                                                var res = self.generateHash(file,fileCachePath).then(function (hash) {
                                                    if(self.newHashMap[fileRelativePath] && self.newHashMap[fileRelativePath] !== hash) {
                                                        dirtyCache = 1;
                                                    }
                                                });
                                            
                                            arr2.push(res);    
                                        });

                                        Promise.all(arr2).then(() => {
                                            if(dirtyCache === 0) {
                                                var verifyFile = fs.createWriteStream(path.join(cachePath,"verify.txt"));
                                                verifyFile.write("heloo world", () => {
                                                    sourceProvider.dispose();
                                                    destProvider.dispose();
                                                    verifyFile.close();  
                                                    resolve(self.artifactItemStore.getTickets());
                                                });
                                                verifyFile.on('error',(err) => {
                                                    console.log(err);
                                                });                                          
                                            }
                                            else {                    
                                                Logger.logMessage("Validation Unsuccessful. Cache not Verified")
                                                self.deleteFolderRecursive(cachePath);
                                                resolve(self.artifactItemStore.getTickets());
                                                
                                            }
                                        });
                                    };
                                });
                            });                                                        
                        });

                        

                        
                    }, (err) => {
                        ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'error', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
                        sourceProvider.dispose();
                        destProvider.dispose();
                        reject(err);
                    });
                });
            }, (err) => {
                ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'error', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
                sourceProvider.dispose();
                destProvider.dispose();
                reject(err);
            });
        });

        return artifactDownloadTicketsPromise;
    }

    processArtifactItem(sourceProvider: models.IArtifactProvider, 
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, resolve, reject);
        });
    }

    processArtifactItemImplementation(sourceProvider: models.IArtifactProvider,
        item: models.ArtifactItem,
        destProvider: models.IArtifactProvider,
        artifactEngineOptions: ArtifactEngineOptions,
        resolve,
        reject,
        retryCount?: number) {
        var retryIfRequired = (err) => {
            if (retryCount === artifactEngineOptions.retryLimit - 1) {
                this.artifactItemStore.updateState(item, models.TicketState.Failed);
                reject(err);
            } else {
                this.artifactItemStore.increaseRetryCount(item);
                Logger.logMessage(tl.loc("RetryingDownload", item.path, (retryCount + 1)));
                setTimeout(() => this
                    .processArtifactItemImplementation(sourceProvider, item, destProvider, artifactEngineOptions, resolve, reject, retryCount + 1), artifactEngineOptions.retryIntervalInSeconds * 1000);
            }
        }
        retryCount = retryCount ? retryCount : 0;
        if (item.itemType === models.ItemType.File) {
            var pathToMatch = item.path.replace(/\\/g, '/');
            var matchOptions = {
                debug: false,
                nobrace: true,
                noglobstar: false,
                dot: true,
                noext: false,
                nocase: false,
                nonull: false,
                matchBase: false,
                nocomment: false,
                nonegate: false,
                flipNegate: false
            };

            if (tl.match([pathToMatch], this.patternList, null, matchOptions).length > 0) {
                Logger.logInfo("Processing " + item.path);

                if(item.fileHash && item.fileHash === this.oldHashMap[item.path.substring(item.path.indexOf('\\')+1)]) {    
                try {    
                        Logger.logMessage(`Downloading ${item.path} From Cache........`);
                        var key = crypto.createHash('SHA256').update(artifactEngineOptions.uniqueUrl).digest('hex');
                        const inputStream = fs.createReadStream(path.join(artifactEngineOptions.cacheDirectory,"ArtifactEngineCache", key, item.path.substring(item.path.indexOf('\\')+1)));
                        destProvider.putArtifactItem(item, inputStream).then((item) => {
                            this.artifactItemStore.updateState(item, models.TicketState.Processed, models.DownloadLocation.Cache);
                            resolve();
                        }, (err) => {
                            Logger.logInfo("Error placing file " + item.path + ": " + err);
                            retryIfRequired(err);
                        });
                    }
                    catch (err) {
                        retryIfRequired("Error getting file " + item.path + ": " + err);
                    }
                }
                else {
                    Logger.logMessage(`Downloading ${item.path} From the Source........`);
                    sourceProvider.getArtifactItem(item).then((contentStream) => {
                        Logger.logInfo("Got download stream for item: " + item.path);
                        destProvider.putArtifactItem(item, contentStream)
                            .then((item) => {
                                this.artifactItemStore.updateState(item, models.TicketState.Processed);
                                resolve();
                            }, (err) => {
                                retryIfRequired("Error placing file " + item.path + ": " + err);
                            });
                    }, (err) => {
                        retryIfRequired("Error getting file " + item.path + ": " + err);
                    });
                }                
            }
            else {
                Logger.logMessage(tl.loc("SkippingItem", pathToMatch));
                this.artifactItemStore.updateState(item, models.TicketState.Skipped);
                resolve();
            }
        }
        else {
            sourceProvider.getArtifactItems(item).then((items: models.ArtifactItem[]) => {
                items = items.map((value, index) => {
                    if (!value.path.toLowerCase().startsWith(item.path.toLowerCase())) {
                        value.path = path.join(item.path, value.path);
                    }

                    return value;
                });

                this.artifactItemStore.addItems(items,this.newHashMap);
                this.artifactItemStore.updateState(item, models.TicketState.Processed);

                Logger.logInfo("Enqueued " + items.length + " for processing.");
                resolve();
            }, (err) => {
                Logger.logInfo("Error getting " + item.path + ":" + err);
                retryIfRequired(err);
            });
        }
    }

    createPatternList(artifactEngineOptions: ArtifactEngineOptions) {
        if (!artifactEngineOptions.itemPattern) {
            this.patternList = ['**'];
        }
        else {
            this.patternList = artifactEngineOptions.itemPattern.split('\n');
        }
    }

    deleteFolderRecursive(cachePath: string) {
        var self = this;
        if( fs.existsSync(cachePath) ) {
          fs.readdirSync(cachePath).forEach(function(file,index) {
            var curPath = path.join(cachePath,file);
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
              self.deleteFolderRecursive(curPath);
            } else { // delete file
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(cachePath);
        }
      }

      walk(dir: string, done) {
        var self = this;
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err)
                return done(err);
            var pending = list.length;
            if (!pending)
                return done(null, results);
            list.forEach(function (file) {
                file = path.resolve(dir, file);
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        self.walk(file, function (err, res) {                  
                            results = results.concat(res);
                            if (!--pending)
                                done(null, results);
                        });
                    }
                    else {                        
                        results.push(file);
                        if (!--pending)
                            done(null, results);
                    }
                });
            });
        });
    };
    
    generateHash(file: string, cachePath: string ) {
        //var deferred = q.defer();
        return new Promise((resolve) => {
            var hash = "";
            var hashInterface = crypto.createHash('sha256');
            var wstream = fs.createWriteStream(cachePath);
            var stream = fs.createReadStream(file);
            stream.on('data', function (data) {
                wstream.write(data);
                wstream.on('error', (err) => {
                    console.log(err);
                });
                hashInterface.update(data, 'utf8');                
            });
            stream.on('end', function () {
                wstream.close();
                hash = hashInterface.digest('hex').toUpperCase();
                resolve(hash);
            });
        })
            
    };  

    private artifactItemStore: ArtifactItemStore = new ArtifactItemStore();
    private logger: Logger;
    private patternList: string[];
    private newHashMap = {};
    private oldHashMap = {};
}

tl.setResourcePath(path.join(path.dirname(__dirname), 'lib.json'));
process.on('unhandledRejection', (err) => {
    ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'unhandledRejection', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
    Logger.logError(tl.loc("UnhandledRejection", err));
    throw err;
});

process.on('uncaughtException', (err) => {
    ci.publishEvent('reliability', <ci.IReliabilityData>{ issueType: 'uncaughtException', errorMessage: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
    Logger.logError(tl.loc("UnhandledException", err));
    throw err;
});