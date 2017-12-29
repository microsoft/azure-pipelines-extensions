import * as fs from 'fs';
import * as crypto from 'crypto';

import { ArtifactItemStore } from '../Store/artifactItemStore';
import { IRequestHandler, IRequestOptions } from './typed-rest-client/Interfaces';
import * as httpm from './typed-rest-client/HttpClient';
import * as models from '../Models';
import * as zlib from 'zlib';

var packagejson = require('../package.json');

export class ZipProvider implements models.IArtifactProvider {
    public artifactItemStore: ArtifactItemStore;

    constructor(zipLocation, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.zipLocation = zipLocation;
        this.options = requestOptions || {};
        this.options.keepAlive = true;
        this.initializeProxy();
        this.httpc = new httpm.HttpClient('artifact-engine ' + packagejson.version, [handler], this.options);
    }

    public getRootItems(): Promise<models.ArtifactItem[]> {
        var rootItem = new models.ArtifactItem();
        rootItem.metadata = { downloadUrl: this.zipLocation };
        rootItem.path = '';
        rootItem.itemType = models.ItemType.File;
        return Promise.resolve([rootItem]);
    }

    public getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        return null;
    }

    public getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
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

                try {
                    resolve(res.message.pipe(zlib.createUnzip()));
                }
                catch (err) {
                    reject(err);
                }
            }, (reason) => {
                reject(reason);
            });
        });

        return promise;
    }

    public putArtifactItem(artifactItem: models.ArtifactItem, stream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        return null;
    }

    public dispose(): void {

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

    private zipLocation: string;
    public httpc: httpm.HttpClient = new httpm.HttpClient('artifact-engine');
    private options: any = {};
}