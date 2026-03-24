import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
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
var tl = require('azure-pipelines-task-lib/task');

export class WebProvider implements IArtifactProvider {

    public artifactItemStore: ArtifactItemStore;

    constructor(rootItemsLocation, templateFile: string, variables: any, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.rootItemsLocation = rootItemsLocation;
        this.templateFile = templateFile;
        this.webClient = WebClientFactory.getClient([handler], requestOptions);
        this.variables = variables;
        this.requestCompressionForDownloads = requestOptions ? requestOptions.requestCompressionForDownloads : false;
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
        var contentType = artifactItem.contentType;
        return this.getItems(itemsUrl, contentType);
    }

    getArtifactItem(artifactItem: ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            if (!artifactItem.metadata || !artifactItem.metadata['downloadUrl']) {
                reject("No downloadUrl available to download the item.");
            }

            var downloadSize: number = 0;
            var contentType: string = artifactItem.contentType;
            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            var zipStream = null;
            itemUrl = itemUrl.replace(/([^:]\/)\/+/g, "$1");

            const additionalHeaders = {};
            if (contentType) {
                additionalHeaders['Accept'] = contentType
            }

            if (this.requestCompressionForDownloads) {
                additionalHeaders['Accept-Encoding'] = "gzip"
            }

            this.webClient.get(itemUrl, additionalHeaders).then((res: HttpClientResponse) => {
                res.message.on('data', (chunk) => {
                    downloadSize += chunk.length;
                });
                res.message.on('end', () => {
                    this.artifactItemStore.updateDownloadSize(artifactItem, downloadSize);
                });
                res.message.on('error', (error) => {
                    if (zipStream) {
                        zipStream.destroy(error);
                        Logger.logMessage(error.toString());
                    }
                    reject(error);
                });

                if (res.message.headers['content-encoding'] === 'gzip') {
                    try {
                        zipStream = zlib.createUnzip();
                        resolve(res.message.pipe(zipStream));
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
        this.webClient.dispose();
    }

    private getItems(itemsUrl: string, contentType: string): Promise<ArtifactItem[]> {
        var promise = new Promise<ArtifactItem[]>((resolve, reject) => {
            itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
            this.webClient.get(itemsUrl, contentType ? { 'Accept': contentType } : { 'Accept': 'application/json' }).then((res: HttpClientResponse) => {
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
    private requestCompressionForDownloads: boolean;
    public webClient: WebClient;
}