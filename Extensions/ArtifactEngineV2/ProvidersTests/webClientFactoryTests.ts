import * as assert from 'assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { WebClientFactory } from '../Providers/webClientFactory';

describe('Unit Tests', () => {
    describe('webClientFactory _readTaskLibSecrets tests', () => {

        let tempDir: string;
        let keyFilePath: string;

        beforeEach(() => {
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wcf-test-'));
            keyFilePath = path.join(tempDir, '.taskkey');
        });

        afterEach(() => {
            // Clean up temp files
            if (fs.existsSync(keyFilePath)) {
                fs.unlinkSync(keyFilePath);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmdirSync(tempDir);
            }
        });

        /**
         * Helper: encrypts a plaintext secret the same way task-lib
         * _exposeTaskLibSecret() does (key:iv in file, AES-256-CTR).
         * Returns the lookupKey in "base64(keyFilePath):base64(encryptedHex)" format.
         */
        function encryptSecret(plaintext: string): string {
            const encryptKey = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);

            // Write key:iv to the key file (base64 encoded, colon-separated)
            const keyFileContent = encryptKey.toString('base64') + ':' + iv.toString('base64');
            fs.writeFileSync(keyFilePath, keyFileContent, 'utf8');

            // Encrypt
            const cipher = crypto.createCipheriv('aes-256-ctr', encryptKey, iv);
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Build lookupKey: base64(keyFilePath):base64(encryptedHex)
            const lookupKey = Buffer.from(keyFilePath, 'utf8').toString('base64')
                + ':'
                + Buffer.from(encrypted, 'utf8').toString('base64');

            return lookupKey;
        }

        it('should round-trip decrypt a secret encrypted with key:iv format', () => {
            const originalSecret = 'myProxyP@ssw0rd!';
            const lookupKey = encryptSecret(originalSecret);

            // Access private static method via bracket notation
            const decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret, `Expected '${originalSecret}' but got '${decrypted}'`);
        });

        it('should decrypt secrets with special characters', () => {
            const originalSecret = 'p@$$w0rd!#%^&*()_+-={}[]|\\:";\'<>?,./~`';
            const lookupKey = encryptSecret(originalSecret);

            const decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });

        it('should decrypt an empty string', () => {
            const originalSecret = '';
            const lookupKey = encryptSecret(originalSecret);

            const decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });

        it('should decrypt a long secret', () => {
            const originalSecret = 'a'.repeat(1024);
            const lookupKey = encryptSecret(originalSecret);

            const decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });

        it('should return undefined for null lookupKey', () => {
            const result = (WebClientFactory as any)._readTaskLibSecrets(null);
            assert.strictEqual(result, undefined);
        });

        it('should return undefined for empty string lookupKey', () => {
            const result = (WebClientFactory as any)._readTaskLibSecrets('');
            assert.strictEqual(result, undefined);
        });

        it('should return undefined for lookupKey without colon separator', () => {
            const result = (WebClientFactory as any)._readTaskLibSecrets('noColonHere');
            assert.strictEqual(result, undefined);
        });

        it('should decrypt correctly with a different key and IV each time', () => {
            const secret1 = 'secret-one';
            const secret2 = 'secret-two';

            const lookup1 = encryptSecret(secret1);
            const lookup2 = encryptSecret(secret2);

            // Both should decrypt independently (key file gets overwritten, so test sequentially)
            // Re-encrypt secret1 last to verify
            const lookup1b = encryptSecret(secret1);
            const decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookup1b);
            assert.strictEqual(decrypted, secret1);
        });

        it('should handle unicode secrets', () => {
            const originalSecret = 'σ»åτáü≡ƒöæπâæπé╣πâ»πâ╝πâë';
            const lookupKey = encryptSecret(originalSecret);

            const decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });
    });

    describe('webClientFactory proxy port tests', () => {

        it('getClient should return a client with numeric proxy port', () => {
            // Set up global proxy variables as task-lib would
            global['_vsts_task_lib_proxy'] = true;
            global['_vsts_task_lib_proxy_url'] = 'http://proxy-server:8080';
            global['_vsts_task_lib_proxy_username'] = '';
            global['_vsts_task_lib_proxy_password'] = '';
            global['_vsts_task_lib_proxy_bypass'] = '[]';

            try {
                const client = WebClientFactory.getClient([], {});
                assert(client, 'client should not be null');
            } finally {
                // Clean up globals
                delete global['_vsts_task_lib_proxy'];
                delete global['_vsts_task_lib_proxy_url'];
                delete global['_vsts_task_lib_proxy_username'];
                delete global['_vsts_task_lib_proxy_password'];
                delete global['_vsts_task_lib_proxy_bypass'];
            }
        });

        it('initializeProxy should read proxy settings from globals', () => {
            global['_vsts_task_lib_proxy'] = true;
            global['_vsts_task_lib_proxy_url'] = 'http://myproxy:3128';
            global['_vsts_task_lib_proxy_username'] = 'user';
            global['_vsts_task_lib_proxy_password'] = '';
            global['_vsts_task_lib_proxy_bypass'] = '["localhost"]';

            try {
                const options: any = {};
                (WebClientFactory as any).initializeProxy(options);

                assert.strictEqual(options.proxy.proxyUrl, 'http://myproxy:3128');
                assert.strictEqual(options.proxy.proxyUsername, 'user');
                assert.deepStrictEqual(options.proxy.proxyBypassHosts, ['localhost']);
            } finally {
                delete global['_vsts_task_lib_proxy'];
                delete global['_vsts_task_lib_proxy_url'];
                delete global['_vsts_task_lib_proxy_username'];
                delete global['_vsts_task_lib_proxy_password'];
                delete global['_vsts_task_lib_proxy_bypass'];
            }
        });

        it('initializeProxy should not overwrite existing proxy options', () => {
            global['_vsts_task_lib_proxy'] = true;
            global['_vsts_task_lib_proxy_url'] = 'http://env-proxy:8080';

            try {
                const options: any = {
                    proxy: {
                        proxyUrl: 'http://explicit-proxy:9090'
                    }
                };
                (WebClientFactory as any).initializeProxy(options);

                // Should keep the explicit proxy, not override with env
                assert.strictEqual(options.proxy.proxyUrl, 'http://explicit-proxy:9090');
            } finally {
                delete global['_vsts_task_lib_proxy'];
                delete global['_vsts_task_lib_proxy_url'];
            }
        });

        it('initializeProxy should read cert settings from globals', () => {
            global['_vsts_task_lib_cert'] = true;
            global['_vsts_task_lib_cert_ca'] = '/path/to/ca.pem';
            global['_vsts_task_lib_cert_clientcert'] = '/path/to/cert.pem';
            global['_vsts_task_lib_cert_key'] = '/path/to/key.pem';
            global['_vsts_task_lib_cert_passphrase'] = '';

            try {
                const options: any = {};
                (WebClientFactory as any).initializeProxy(options);

                assert.strictEqual(options.cert.caFile, '/path/to/ca.pem');
                assert.strictEqual(options.cert.certFile, '/path/to/cert.pem');
                assert.strictEqual(options.cert.keyFile, '/path/to/key.pem');
            } finally {
                delete global['_vsts_task_lib_cert'];
                delete global['_vsts_task_lib_cert_ca'];
                delete global['_vsts_task_lib_cert_clientcert'];
                delete global['_vsts_task_lib_cert_key'];
                delete global['_vsts_task_lib_cert_passphrase'];
            }
        });

        it('initializeProxy should set ignoreSslError from globals', () => {
            global['_vsts_task_lib_skip_cert_validation'] = true;

            try {
                const options: any = {};
                (WebClientFactory as any).initializeProxy(options);

                assert.strictEqual(options.ignoreSslError, true);
            } finally {
                delete global['_vsts_task_lib_skip_cert_validation'];
            }
        });
    });
});
