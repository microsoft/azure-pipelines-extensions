import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as crypto from 'crypto';
import * as zlib from 'zlib';

var handlebars = require('handlebars');
var httpm = require('typed-rest-client/HttpClient');
var tl = require('vsts-task-lib');

import * as models from '../Models';
import { Logger } from '../Engine/logger';
import { IRequestHandler, IRequestOptions } from './Handlers/interfaces';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { request } from 'https';

var packagejson = require('../package.json');

export class WebProvider implements models.IArtifactProvider {

    constructor(rootItemsLocation, templateFile: string, variables: any, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.rootItemsLocation = rootItemsLocation;
        this.templateFile = templateFile;
        this.options = requestOptions || {};
        this.options.proxy = tl.getHttpProxyConfiguration();
        this.options.cert = tl.getHttpCertConfiguration();
        this.options.keepAlive = true;
        this.httpc = new httpm.HttpClient('artifact-engine ' + packagejson.version, [handler], this.options);
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

            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            itemUrl = itemUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemUrl).then((res: any) => {
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

    dispose() : void {
        this.httpc.dispose();
    }

    private getItems(itemsUrl: string): Promise<models.ArtifactItem[]> {
        var promise = new Promise<models.ArtifactItem[]>((resolve, reject) => {
            itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemsUrl, { 'Accept': 'application/json' }).then((resp: any) => {
                resp.readBody().then((body: string) => {
                    fs.readFile(this.getTemplateFilePath(), 'utf8', (err, templateFileContent) => {
                        if (err) {
                            Logger.logError(err ? JSON.stringify(err) : "");
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
                            Logger.logError("Failed to parse response body: " + body + " , got error : " + error);
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
    public httpc: any = new httpm.HttpClient('artifact-engine');
    private options: any = {};
}