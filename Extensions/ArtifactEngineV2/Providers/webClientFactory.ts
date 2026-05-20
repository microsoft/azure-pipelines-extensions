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

            // file contains encryption key and IV in "key:iv" format (task-lib 5.2.4+)
            let keyFile = Buffer.from(lookupInfo[0], 'base64').toString('utf8');
            let keyAndIv: string = fs.readFileSync(keyFile, 'utf8');
            let [keyBase64, ivBase64] = keyAndIv.split(':', 2);
            let encryptKey = Buffer.from(keyBase64, 'base64');
            // Use IV from file if present (task-lib 5.2.4+), fall back to zero IV for older task-lib
            let iv = ivBase64 ? Buffer.from(ivBase64, 'base64') : Buffer.alloc(16, 0);

            let encryptedContent: string = Buffer.from(lookupInfo[1], 'base64').toString('utf8');

            let decipher = crypto.createDecipheriv("aes-256-ctr", encryptKey, iv);
            let decryptedContent = decipher.update(encryptedContent, 'hex', 'utf8');
            decryptedContent += decipher.final('utf8');

            return decryptedContent;
        }
    }
}