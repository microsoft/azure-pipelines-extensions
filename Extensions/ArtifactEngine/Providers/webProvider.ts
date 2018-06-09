import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as zlib from 'zlib';

import * as httpm from './typed-rest-client/HttpClient';
import * as models from '../Models';
import { Logger } from '../Engine/logger';
import { IRequestHandler, IRequestOptions } from './typed-rest-client/Interfaces';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import * as factory from './webClientFactory';

var handlebars = require('handlebars');
var tl = require('vsts-task-lib/task');

export class WebProvider implements models.IArtifactProvider {

    public artifactItemStore: ArtifactItemStore;

    constructor(rootItemsLocation, templateFile: string, variables: any, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.rootItemsLocation = rootItemsLocation;
        this.templateFile = templateFile;
        this.httpc = factory.WebClientFactory.getClient([handler], requestOptions);
        this.variables = variables;
    }

    getRootItems(): Promise<models.ArtifactItem[]> {
        var rootItem = new models.ArtifactItem();
        rootItem.metadata = { downloadUrl: this.rootItemsLocation };
        rootItem.path = '';
        rootItem.itemType = models.ItemType.Folder;
        return Promise.resolve([rootItem]);
    }

    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        var itemsUrl = artifactItem.metadata["downloadUrl"];
        return this.getItems(itemsUrl);
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            if (!artifactItem.metadata || !artifactItem.metadata['downloadUrl']) {
                reject("No downloadUrl available to download the item.");
            }

            var downloadSize: number = 0;
            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            itemUrl = itemUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemUrl).then((res: httpm.HttpClientResponse) => {
                res.message.on('data', (chunk) => {
                    downloadSize += chunk.length;
                });
                res.message.on('end', () => {
                    this.artifactItemStore.updateDownloadSize(artifactItem, downloadSize);
                });
                if (res.message.headers['content-encoding'] === 'gzip') {
                    try {
                        resolve(res.message.pipe(zlib.createUnzip()));
                    }
                    catch (err) {
                        reject(err);
                    }
                }
                else {
                    resolve(res.message);
                }
            }, (reason) => {
                reject(reason);
            });
        });

        return promise;
    }

    putArtifactItem(item: models.ArtifactItem, readStream: stream.Readable): Promise<models.ArtifactItem> {
        throw new Error("Not implemented");
    }

    dispose(): void {
        this.httpc.dispose();
    }

    private getItems(itemsUrl: string): Promise<models.ArtifactItem[]> {
        var promise = new Promise<models.ArtifactItem[]>((resolve, reject) => {
            itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemsUrl, { 'Accept': 'application/json' }).then((resp: httpm.HttpClientResponse) => {
                resp.readBody().then((body: string) => {
                    fs.readFile(this.getTemplateFilePath(), 'utf8', (err, templateFileContent) => {
                        if (err) {
                            Logger.logMessage(err ? JSON.stringify(err) : "");
                            reject(err);
                        }

                        try {
                            var template = handlebars.compile(templateFileContent);
                            var response = JSON.parse(body);
                            var context = this.extend(response, this.variables);
                            var result = template(context);
                            var items = JSON.parse(result);

                            resolve(items);
                        } catch (error) {
                            Logger.logMessage(tl.loc("FailedToParseResponse", body, error));
                            reject(error);
                        }
                    });
                }, (err) => {
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
        });

        return promise;
    }

    private getTemplateFilePath(): string {
        return path.isAbsolute(this.templateFile) ? this.templateFile : path.join(__dirname, this.templateFile);
    }

    private extend(target, source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }

        return target;
    }

    private rootItemsLocation: string;
    private templateFile: string;
    private variables: string;
    public httpc: httpm.HttpClient = new httpm.HttpClient('artifact-engine');
}