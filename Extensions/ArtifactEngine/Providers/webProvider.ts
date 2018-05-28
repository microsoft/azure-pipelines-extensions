import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as crypto from 'crypto';
import * as zlib from 'zlib';

import { ArtifactItem, IArtifactProvider, ItemType } from '../Models';
import { Logger } from '../Engine/logger';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { WebClientFactory } from './webClientFactory';
import { WebClient } from './webClient'

// only import types from typed-rest-client here
import { IRequestHandler, IRequestOptions } from './typed-rest-client/Interfaces';
import { HttpClientResponse } from './typed-rest-client/HttpClient';

var handlebars = require('handlebars');
var tl = require('vsts-task-lib/task');

export class WebProvider implements IArtifactProvider {

    public artifactItemStore: ArtifactItemStore;

    constructor(rootItemsLocation, templateFile: string, variables: any, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.rootItemsLocation = rootItemsLocation;
        this.templateFile = templateFile;
        this.httpc = WebClientFactory.getClient([handler], requestOptions);
        this.variables = variables;
    }

    getRootItems(): Promise<ArtifactItem[]> {
        var rootItem = new ArtifactItem();
        rootItem.metadata = { downloadUrl: this.rootItemsLocation };
        rootItem.path = '';
        rootItem.itemType = ItemType.Folder;
        return Promise.resolve([rootItem]);
    }

    getArtifactItems(artifactItem: ArtifactItem): Promise<ArtifactItem[]> {
        var itemsUrl = artifactItem.metadata["downloadUrl"];
        return this.getItems(itemsUrl);
    }

    getArtifactItem(artifactItem: ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            if (!artifactItem.metadata || !artifactItem.metadata['downloadUrl']) {
                reject("No downloadUrl available to download the item.");
            }

            var downloadSize: number = 0;
            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            itemUrl = itemUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemUrl).then((res: HttpClientResponse) => {
                res.message.on('data', (chunk) => {
                    downloadSize += chunk.length;
                });
                res.message.on('end', () => {
                    this.artifactItemStore.updateDownloadSize(artifactItem, downloadSize);
                });
                res.message.on('error', (error) => {
                    reject(error);
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

    putArtifactItem(item: ArtifactItem, readStream: stream.Readable): Promise<ArtifactItem> {
        throw new Error("Not implemented");
    }

    dispose(): void {
        this.httpc.dispose();
    }

    private getItems(itemsUrl: string): Promise<ArtifactItem[]> {
        var promise = new Promise<ArtifactItem[]>((resolve, reject) => {
            itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemsUrl, { 'Accept': 'application/json' }).then((res: HttpClientResponse) => {
                res.readBody().then((body: string) => {
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
    public httpc: WebClient;
}