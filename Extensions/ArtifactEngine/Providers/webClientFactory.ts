import * as fs from 'fs';
import * as crypto from 'crypto';
import { WebClient } from './webClient'
export class WebClientFactory {

    public static getClient(handlers: any[], options: any): any {
        options = options || {};
        options.keepAlive = true;
        this.initializeProxy(options);
        return new WebClient(handlers, options);
    }

    private static initializeProxy(options) {
        // try get proxy setting from environment variable set by azure-pipelines-task-lib if there is no proxy setting in the options
        if (!options.proxy || !options.proxy.proxyUrl) {
            if (global['_vsts_task_lib_proxy']) {
                let proxyFromEnv: any = {
                    proxyUrl: global['_vsts_task_lib_proxy_url'],
                    proxyUsername: global['_vsts_task_lib_proxy_username'],
                    proxyPassword: this._readTaskLibSecrets(global['_vsts_task_lib_proxy_password']),
                    proxyBypassHosts: JSON.parse(global['_vsts_task_lib_proxy_bypass'] || "[]"),
                };

                options.proxy = proxyFromEnv;
            }
        }

        // try get cert setting from environment variable set by azure-pipelines-task-lib if there is no cert setting in the options
        if (!options.cert) {
            if (global['_vsts_task_lib_cert']) {
                let certFromEnv: any = {
                    caFile: global['_vsts_task_lib_cert_ca'],
                    certFile: global['_vsts_task_lib_cert_clientcert'],
                    keyFile: global['_vsts_task_lib_cert_key'],
                    passphrase: this._readTaskLibSecrets(global['_vsts_task_lib_cert_passphrase']),
                };

                options.cert = certFromEnv;
            }
        }

        // try get ignore SSL error setting from environment variable set by azure-pipelines-task-lib if there is no ignore SSL error setting in the options
        if (!options.ignoreSslError) {
            options.ignoreSslError = !!global['_vsts_task_lib_skip_cert_validation'];
        }
    }

    private static _readTaskLibSecrets(lookupKey: string): string {
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
}