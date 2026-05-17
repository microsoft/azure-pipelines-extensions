var libMocker = require("azure-pipelines-task-lib/lib-mocker");
var crypto = require("crypto");
// `node:fs` bypasses any mocks registered for the plain `fs` key, so this
// reference is guaranteed to be the real fs even if other test files have
// already enabled the mocker.
var realFs = require("node:fs");

import * as assert from 'assert';

// Mock fs to intercept readFileSync calls for key file reads while
// delegating everything else to the real fs so task-lib can initialize.
var mockKeyFileContent: string = '';
libMocker.registerMock('fs', {
    readFileSync: (filePath, encoding) => {
        // If reading our fake key file path, return mocked content
        if (typeof filePath === 'string' && filePath.indexOf('.taskkey') >= 0) {
            return mockKeyFileContent;
        }
        return realFs.readFileSync(filePath, encoding);
    },
    writeFileSync: (filePath, data, options) => {
        return realFs.writeFileSync(filePath, data, options);
    },
    existsSync: (filePath) => {
        return realFs.existsSync(filePath);
    },
    statSync: (filePath) => {
        return realFs.statSync(filePath);
    },
    mkdirSync: (dirPath, options) => {
        return realFs.mkdirSync(dirPath, options);
    },
    unlinkSync: (filePath) => {
        return realFs.unlinkSync(filePath);
    },
    chmodSync: (filePath, mode) => {
        return realFs.chmodSync(filePath, mode);
    }
});
libMocker.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

import { WebClientFactory } from '../Providers/webClientFactory';
import { HttpClient } from '../Providers/typed-rest-client/HttpClient';

var sinon = require('sinon');

/**
 * Helper: encrypts a plaintext secret the same way task-lib
 * _exposeTaskLibSecret() does (key:iv in file, AES-256-CTR).
 * Sets up the mock key file content and returns the lookupKey.
 */
function encryptSecret(plaintext: string): string {
    var encryptKey = crypto.randomBytes(32);
    var iv = crypto.randomBytes(16);

    // Set mock key file content (key:iv in base64, colon-separated)
    mockKeyFileContent = encryptKey.toString('base64') + ':' + iv.toString('base64');

    // Encrypt
    var cipher = crypto.createCipheriv('aes-256-ctr', encryptKey, iv);
    var encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Build lookupKey: base64(keyFilePath):base64(encryptedHex)
    var lookupKey = Buffer.from('/fake/path/.taskkey', 'utf8').toString('base64')
        + ':'
        + Buffer.from(encrypted, 'utf8').toString('base64');

    return lookupKey;
}

beforeEach(() => {
    mockKeyFileContent = '';
});

describe('Unit Tests', () => {
    describe('webClientFactory _readTaskLibSecrets tests', () => {

        it('should round-trip decrypt a secret encrypted with key:iv format', () => {
            var originalSecret = 'myProxyP@ssw0rd!';
            var lookupKey = encryptSecret(originalSecret);

            var decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret, 'Expected \'' + originalSecret + '\' but got \'' + decrypted + '\'');
        });

        it('should decrypt secrets with special characters', () => {
            var originalSecret = 'p@$$w0rd!#%^&*()_+-={}[]|\\:";\'<>?,./~`';
            var lookupKey = encryptSecret(originalSecret);

            var decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });

        it('should decrypt an empty string', () => {
            var originalSecret = '';
            var lookupKey = encryptSecret(originalSecret);

            var decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });

        it('should decrypt a long secret', () => {
            var originalSecret = 'a'.repeat(1024);
            var lookupKey = encryptSecret(originalSecret);

            var decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });

        it('should return undefined for null lookupKey', () => {
            var result = (WebClientFactory as any)._readTaskLibSecrets(null);
            assert.strictEqual(result, undefined);
        });

        it('should return undefined for empty string lookupKey', () => {
            var result = (WebClientFactory as any)._readTaskLibSecrets('');
            assert.strictEqual(result, undefined);
        });

        it('should return undefined for lookupKey without colon separator', () => {
            var result = (WebClientFactory as any)._readTaskLibSecrets('noColonHere');
            assert.strictEqual(result, undefined);
        });

        it('should decrypt correctly with a different key and IV each time', () => {
            var secret1 = 'secret-one';

            var lookup1 = encryptSecret(secret1);
            var decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookup1);
            assert.strictEqual(decrypted, secret1);

            var secret2 = 'secret-two';
            var lookup2 = encryptSecret(secret2);
            var decrypted2 = (WebClientFactory as any)._readTaskLibSecrets(lookup2);
            assert.strictEqual(decrypted2, secret2);
        });

        it('should handle unicode secrets', () => {
            var originalSecret = '\u03C3\u00BB\u00E5\u03C4\u00E1\u00FC';
            var lookupKey = encryptSecret(originalSecret);

            var decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, originalSecret);
        });

        it('should fall back to zero IV for older task-lib format (key only, no IV)', () => {
            var encryptKey = crypto.randomBytes(32);
            var zeroIv = Buffer.alloc(16, 0);

            // Older task-lib writes only the key (no colon, no IV)
            mockKeyFileContent = encryptKey.toString('base64');

            // Encrypt with zero IV (what older task-lib does)
            var cipher = crypto.createCipheriv('aes-256-ctr', encryptKey, zeroIv);
            var encrypted = cipher.update('oldSecret', 'utf8', 'hex');
            encrypted += cipher.final('hex');

            var lookupKey = Buffer.from('/fake/path/.taskkey', 'utf8').toString('base64')
                + ':'
                + Buffer.from(encrypted, 'utf8').toString('base64');

            var decrypted = (WebClientFactory as any)._readTaskLibSecrets(lookupKey);

            assert.strictEqual(decrypted, 'oldSecret');
        });
    });

    describe('webClientFactory proxy port tests', () => {

        afterEach(() => {
            // Clean up globals
            delete global['_vsts_task_lib_proxy'];
            delete global['_vsts_task_lib_proxy_url'];
            delete global['_vsts_task_lib_proxy_username'];
            delete global['_vsts_task_lib_proxy_password'];
            delete global['_vsts_task_lib_proxy_bypass'];
            delete global['_vsts_task_lib_cert'];
            delete global['_vsts_task_lib_cert_ca'];
            delete global['_vsts_task_lib_cert_clientcert'];
            delete global['_vsts_task_lib_cert_key'];
            delete global['_vsts_task_lib_cert_passphrase'];
            delete global['_vsts_task_lib_skip_cert_validation'];
        });

        it('getClient should return a client with numeric proxy port', () => {
            global['_vsts_task_lib_proxy'] = true;
            global['_vsts_task_lib_proxy_url'] = 'http://proxy-server:8080';
            global['_vsts_task_lib_proxy_username'] = '';
            global['_vsts_task_lib_proxy_password'] = '';
            global['_vsts_task_lib_proxy_bypass'] = '[]';

            var client = WebClientFactory.getClient([], {});
            assert(client, 'client should not be null');
        });

        it('tunnel agent should receive numeric port from explicit proxy port', () => {
            var httpClient = new HttpClient('test-agent', [], {
                proxy: {
                    proxyUrl: 'http://proxy-server:8080',
                    proxyUsername: '',
                    proxyPassword: ''
                }
            });

            var agent = (httpClient as any)._getAgent('http://target-server/artifact');
            var proxyAgent = (httpClient as any)._proxyAgent;

            assert(proxyAgent, 'proxy agent should be created');
            assert.strictEqual(proxyAgent.options.proxy.port, 8080, 'port should be numeric 8080');
            assert.strictEqual(typeof proxyAgent.options.proxy.port, 'number', 'port should be of type number');
        });

        it('tunnel agent should default to port 80 for HTTP proxy without explicit port', () => {
            var httpClient = new HttpClient('test-agent', [], {
                proxy: {
                    proxyUrl: 'http://proxy-server',
                    proxyUsername: '',
                    proxyPassword: ''
                }
            });

            var agent = (httpClient as any)._getAgent('http://target-server/artifact');
            var proxyAgent = (httpClient as any)._proxyAgent;

            assert(proxyAgent, 'proxy agent should be created');
            assert.strictEqual(proxyAgent.options.proxy.port, 80, 'port should default to 80 for HTTP proxy');
            assert.strictEqual(typeof proxyAgent.options.proxy.port, 'number', 'port should be of type number');
        });

        it('tunnel agent should default to port 443 for HTTPS proxy without explicit port', () => {
            var httpClient = new HttpClient('test-agent', [], {
                proxy: {
                    proxyUrl: 'https://secure-proxy',
                    proxyUsername: '',
                    proxyPassword: ''
                }
            });

            var agent = (httpClient as any)._getAgent('https://target-server/artifact');
            var proxyAgent = (httpClient as any)._proxyAgent;

            assert(proxyAgent, 'proxy agent should be created');
            assert.strictEqual(proxyAgent.options.proxy.port, 443, 'port should default to 443 for HTTPS proxy');
            assert.strictEqual(typeof proxyAgent.options.proxy.port, 'number', 'port should be of type number');
        });

        it('HTTPS target through HTTP proxy should create tunnel agent', () => {
            var httpClient = new HttpClient('test-agent', [], {
                proxy: {
                    proxyUrl: 'http://proxy-server:3128',
                    proxyUsername: '',
                    proxyPassword: ''
                }
            });

            var agent = (httpClient as any)._getAgent('https://artifacts.dev.azure.com/download');
            var proxyAgent = (httpClient as any)._proxyAgent;

            assert(proxyAgent, 'proxy agent should be created for HTTPS target through HTTP proxy');
            assert.strictEqual(proxyAgent.options.proxy.host, 'proxy-server', 'proxy host should be set');
            assert.strictEqual(proxyAgent.options.proxy.port, 3128, 'proxy port should be numeric 3128');
        });

        it('HTTP target through HTTP proxy should create tunnel agent', () => {
            var httpClient = new HttpClient('test-agent', [], {
                proxy: {
                    proxyUrl: 'http://proxy-server:3128',
                    proxyUsername: '',
                    proxyPassword: ''
                }
            });

            var agent = (httpClient as any)._getAgent('http://artifacts.dev.azure.com/download');
            var proxyAgent = (httpClient as any)._proxyAgent;

            assert(proxyAgent, 'proxy agent should be created for HTTP target through HTTP proxy');
            assert.strictEqual(proxyAgent.options.proxy.host, 'proxy-server', 'proxy host should be set');
            assert.strictEqual(proxyAgent.options.proxy.port, 3128, 'proxy port should be numeric 3128');
        });

        it('tunnel agent should include proxy auth credentials with special characters', () => {
            var httpClient = new HttpClient('test-agent', [], {
                proxy: {
                    proxyUrl: 'http://proxy-server:8080',
                    proxyUsername: 'admin',
                    proxyPassword: 'p@ss:w0rd#!'
                }
            });

            var agent = (httpClient as any)._getAgent('http://target-server/artifact');
            var proxyAgent = (httpClient as any)._proxyAgent;

            assert(proxyAgent, 'proxy agent should be created');
            assert.strictEqual(proxyAgent.options.proxy.proxyAuth, 'admin:p@ss:w0rd#!');
        });

        it('initializeProxy should read proxy settings from globals', () => {
            global['_vsts_task_lib_proxy'] = true;
            global['_vsts_task_lib_proxy_url'] = 'http://myproxy:3128';
            global['_vsts_task_lib_proxy_username'] = 'user';
            global['_vsts_task_lib_proxy_password'] = '';
            global['_vsts_task_lib_proxy_bypass'] = '["localhost"]';

            var options: any = {};
            (WebClientFactory as any).initializeProxy(options);

            assert.strictEqual(options.proxy.proxyUrl, 'http://myproxy:3128');
            assert.strictEqual(options.proxy.proxyUsername, 'user');
            assert.deepStrictEqual(options.proxy.proxyBypassHosts, ['localhost']);
        });

        it('initializeProxy should not overwrite existing proxy options', () => {
            global['_vsts_task_lib_proxy'] = true;
            global['_vsts_task_lib_proxy_url'] = 'http://env-proxy:8080';

            var options: any = {
                proxy: {
                    proxyUrl: 'http://explicit-proxy:9090'
                }
            };
            (WebClientFactory as any).initializeProxy(options);

            assert.strictEqual(options.proxy.proxyUrl, 'http://explicit-proxy:9090');
        });

        it('initializeProxy should read cert settings from globals', () => {
            global['_vsts_task_lib_cert'] = true;
            global['_vsts_task_lib_cert_ca'] = '/path/to/ca.pem';
            global['_vsts_task_lib_cert_clientcert'] = '/path/to/cert.pem';
            global['_vsts_task_lib_cert_key'] = '/path/to/key.pem';
            global['_vsts_task_lib_cert_passphrase'] = '';

            var options: any = {};
            (WebClientFactory as any).initializeProxy(options);

            assert.strictEqual(options.cert.caFile, '/path/to/ca.pem');
            assert.strictEqual(options.cert.certFile, '/path/to/cert.pem');
            assert.strictEqual(options.cert.keyFile, '/path/to/key.pem');
        });

        it('initializeProxy should set ignoreSslError from globals', () => {
            global['_vsts_task_lib_skip_cert_validation'] = true;

            var options: any = {};
            (WebClientFactory as any).initializeProxy(options);

            assert.strictEqual(options.ignoreSslError, true);
        });
    });

    describe('webClientFactory _readTaskLibSecrets error handling', () => {

        it('should throw ENOENT for corrupted base64 in lookupKey', () => {
            var corruptedLookup = 'validBase64Path:!!!invalid-base64!!!';
            var thrownError = null;

            try {
                (WebClientFactory as any)._readTaskLibSecrets(corruptedLookup);
            } catch (e) {
                thrownError = e;
            }

            assert(thrownError, 'should have thrown an error');
            assert(thrownError.message.indexOf('ENOENT') >= 0 || thrownError.message.indexOf('no such file') >= 0,
                'Expected ENOENT error but got: ' + thrownError.message);
        });

        it('should throw invalid key length when key file content is empty', () => {
            mockKeyFileContent = '';

            var lookupKey = Buffer.from('/fake/path/.taskkey', 'utf8').toString('base64')
                + ':'
                + Buffer.from('deadbeef', 'utf8').toString('base64');
            var thrownError = null;

            try {
                (WebClientFactory as any)._readTaskLibSecrets(lookupKey);
            } catch (e) {
                thrownError = e;
            }

            assert(thrownError, 'should have thrown an error');
            assert(thrownError.message.indexOf('Invalid key length') >= 0,
                'Expected Invalid key length error but got: ' + thrownError.message);
        });

        it('should throw invalid key length when key file has only whitespace', () => {
            mockKeyFileContent = '   \n  ';

            var lookupKey = Buffer.from('/fake/path/.taskkey', 'utf8').toString('base64')
                + ':'
                + Buffer.from('deadbeef', 'utf8').toString('base64');
            var thrownError = null;

            try {
                (WebClientFactory as any)._readTaskLibSecrets(lookupKey);
            } catch (e) {
                thrownError = e;
            }

            assert(thrownError, 'should have thrown an error');
            assert(thrownError.message.indexOf('Invalid key length') >= 0,
                'Expected Invalid key length error but got: ' + thrownError.message);
        });
    });
});
after(() => {
    libMocker.deregisterAll();
});
