import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as crypto from 'crypto';
import * as zlib from 'zlib';

var handlebars = require('handlebars');
import * as httpm from './typed-rest-client/HttpClient';
var tl = require('vsts-task-lib');

import * as models from '../Models';
import { Logger } from '../Engine/logger';
import { IRequestHandler, IRequestOptions } from './typed-rest-client/Interfaces';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { request } from 'https';

var packagejson = require('../package.json');

export class WebProvider implements models.IArtifactProvider {

    public artifactItemStore: ArtifactItemStore;

    constructor(rootItemsLocation, templateFile: string, variables: any, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.rootItemsLocation = rootItemsLocation;
        this.templateFile = templateFile;
        this.options = requestOptions || {};
        this.options.keepAlive = true;
        this.initializeProxy();
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
            this.httpc.get(itemUrl).then((res: httpm.HttpClientResponse) => {
                res.message.on('end', () => {
                    this.artifactItemStore.updateDownloadSize(artifactItem, res.message.socket.bytesRead);
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

    private initializeProxy() {
        // try get proxy setting from environment variable set by VSTS-Task-Lib if there is no proxy setting in the options
        if (!this.options.proxy || !this.options.proxy.proxyUrl) {
            if (global['_vsts_task_lib_proxy']) {
                let proxyFromEnv: any = {
                    proxyUrl: global['_vsts_task_lib_proxy_url'],
                    proxyUsername: global['_vsts_task_lib_proxy_username'],
                    proxyPassword: this._readTaskLibSecrets(global['_vsts_task_lib_proxy_password']),
                    proxyBypassHosts: JSON.parse(global['_vsts_task_lib_proxy_bypass'] || "[]"),
                };

                this.options.proxy = proxyFromEnv;
            }
        }

        // try get cert setting from environment variable set by VSTS-Task-Lib if there is no cert setting in the options
        if (!this.options.cert) {
            if (global['_vsts_task_lib_cert']) {
                let certFromEnv: any = {
                    caFile: global['_vsts_task_lib_cert_ca'],
                    certFile: global['_vsts_task_lib_cert_clientcert'],
                    keyFile: global['_vsts_task_lib_cert_key'],
                    passphrase: this._readTaskLibSecrets(global['_vsts_task_lib_cert_passphrase']),
                };

                this.options.cert = certFromEnv;
            }
        }

        // try get ignore SSL error setting from environment variable set by VSTS-Task-Lib if there is no ignore SSL error setting in the options
        if (!this.options.ignoreSslError) {
            this.options.ignoreSslError = !!global['_vsts_task_lib_skip_cert_validation'];
        }
    }

    private _readTaskLibSecrets(lookupKey: string): string {
        // the lookupKey should has following format
        // base64encoded<keyFilePath>:base64encoded<encryptedContent>
        if (lookupKey && lookupKey.indexOf(':') > 0) {
            let lookupInfo: string[] = lookupKey.split(':', 2);

            // file contains encryption key
            let keyFile = new Buffer(lookupInfo[0], 'base64').toString('utf8');
            let encryptKey = new Buffer(fs.readFileSync(keyFile, 'utf8'), 'base64');

            let encryptedContent: string = new Buffer(lookupInfo[1], 'base64').toString('utf8');

            let decipher = crypto.createDecipher("aes-256-ctr", encryptKey)
            let decryptedContent = decipher.update(encryptedContent, 'hex', 'utf8')
            decryptedContent += decipher.final('utf8');

            return decryptedContent;
        }
    }

    private rootItemsLocation: string;
    private templateFile: string;
    private variables: string;
    public httpc: httpm.HttpClient = new httpm.HttpClient('artifact-engine');
    private options: any = {};
}