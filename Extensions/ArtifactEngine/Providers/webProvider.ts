import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as crypto from 'crypto';
import * as zlib from 'zlib';

var handlebars = require('handlebars');
import * as httpm from 'typed-rest-client/HttpClient';

import * as models from '../Models';
import { Logger } from '../Engine/logger';
import { BasicCredentialHandler } from './Handlers/basiccreds';
import { IRequestHandler, IRequestOptions } from './Handlers/interfaces';
import { ArtifactItemStore } from '../Store/artifactItemStore';

var packagejson = require('../package.json');

export class WebProvider implements models.IArtifactProvider {

    constructor(rootItemsLocation, templateFile: string, variables: any, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.rootItemsLocation = rootItemsLocation;
        this.templateFile = templateFile;
        this.options = requestOptions || {};
        this.initializeOptions();
        this.httpc = new httpm.HttpClient('item-level-downloader ' + packagejson.version, [handler], this.options);
        this.variables = variables;
    }

    getRootItems(): Promise<models.ArtifactItem[]> {
        return this.getItems(this.rootItemsLocation);
    }

    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        var itemsUrl = artifactItem.metadata["downloadUrl"];
        return this.getItems(itemsUrl);
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>(async (resolve, reject) => {
            if (!artifactItem.metadata || !artifactItem.metadata['downloadUrl']) {
                reject("No downloadUrl available to download the item.");
            }

            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            itemUrl = itemUrl.replace(/([^:]\/)\/+/g, "$1");
            var getResponsePromise = this.httpc.get(itemUrl);
            getResponsePromise.catch(reason => {
                reject(reason);
            });

            let res: httpm.HttpClientResponse = await getResponsePromise;

            if (res.message.headers['content-encoding'] === 'gzip') {
                resolve(res.message.pipe(zlib.createUnzip()));
            }
            else {
                resolve(res.message);
            }
        });

        return promise;
    }

    putArtifactItem(item: models.ArtifactItem, readStream: stream.Readable): Promise<models.ArtifactItem> {
        throw new Error("Not implemented");
    }

    private getItems(itemsUrl: string): Promise<models.ArtifactItem[]> {
        var promise = new Promise<models.ArtifactItem[]>(async (resolve, reject) => {
            itemsUrl = itemsUrl.replace(/([^:]\/)\/+/g, "$1");

            let getItemsPromise = this.httpc.get(itemsUrl, { 'Accept': 'application/json' });
            getItemsPromise.catch(reason => {
                reject(reason);
            });

            let resp: httpm.HttpClientResponse = await getItemsPromise;

            let readBodyPromise = resp.readBody();
            readBodyPromise.catch(reason => {
                reject(reason);
            });

            let body: string = await readBodyPromise;

            fs.readFile(this.getTemplateFilePath(), 'utf8', (err, templateFileContent) => {
                if (err) {
                    Logger.logError(err ? JSON.stringify(err) : "");
                    reject(err);
                }

                var template = handlebars.compile(templateFileContent);
                try {
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
        });

        return promise;
    }

    private initializeOptions() {
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
    public httpc: httpm.HttpClient = new httpm.HttpClient('item-level-downloader');
    private options: any = {};
}