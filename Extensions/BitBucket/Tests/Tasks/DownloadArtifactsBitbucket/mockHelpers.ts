import events = require('events');
import tmrm = require('azure-pipelines-task-lib/mock-run');

export const CONNECTION_ID = 'bitbucket-connection-id';
export const REPOSITORY_ID = 'workspace/repo';
export const BRANCH_MAIN = 'refs/heads/main';
export const BRANCH_DEVELOP = 'develop';
export const COMMIT_ID = '1234567890abcdef1234567890abcdef12345678';
export const DOWNLOAD_PATH = '.';
export const TOKEN_EMAIL = 'token-user@example.com';
export const TOKEN_VALUE = 'bb-token';
export const USERNAME = 'bb-user';
export const PASSWORD = 'bb-pass';
export const SOURCE_TASK_PATH = 'Extensions/BitBucket/Src/Tasks/DownloadArtifactsBitbucket/downloadBitbucket.js';

export interface ScenarioOptions {
    scheme?: 'Token' | 'UsernamePassword' | 'Unsupported';
    authParameters?: { [key: string]: string };
    authObjectRaw?: string;
    apiResponseText?: string;
    cloneFails?: boolean;
    checkoutFailsAt?: number;
    cleanupFixture?: boolean;
    cleanupThrows?: boolean;
}

export function setRequiredInputs(tr: tmrm.TaskMockRunner, overrides?: { [key: string]: string | undefined }): void {
    const inputMap: { [key: string]: string | undefined } = {
        connection: CONNECTION_ID,
        definition: REPOSITORY_ID,
        branch: BRANCH_MAIN,
        version: COMMIT_ID,
        downloadPath: DOWNLOAD_PATH
    };

    if (overrides) {
        for (const key of Object.keys(overrides)) {
            inputMap[key] = overrides[key];
        }
    }

    Object.keys(inputMap).forEach(function (name) {
        const value = inputMap[name];
        if (value !== undefined) {
            tr.setInput(name, value);
        }
    });
}

export function setEndpointAuth(options?: ScenarioOptions): void {
    const scenario = options || {};
    const scheme = scenario.scheme || 'Token';
    const endpoint = CONNECTION_ID;
    const parameters = scenario.authParameters;

    if (scenario.authObjectRaw !== undefined) {
        process.env['ENDPOINT_AUTH_' + endpoint] = scenario.authObjectRaw;
        return;
    }

    if (scheme === 'Token') {
        process.env['ENDPOINT_AUTH_' + endpoint] = JSON.stringify({
            scheme: 'Token',
            parameters: parameters || {
                apitoken: TOKEN_VALUE,
                email: TOKEN_EMAIL
            }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + endpoint] = 'Token';
        process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_APITOKEN'] = TOKEN_VALUE;
        process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_EMAIL'] = TOKEN_EMAIL;
        return;
    }

    if (scheme === 'UsernamePassword') {
        process.env['ENDPOINT_AUTH_' + endpoint] = JSON.stringify({
            scheme: 'UsernamePassword',
            parameters: parameters || {
                username: USERNAME,
                password: PASSWORD
            }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + endpoint] = 'UsernamePassword';
        process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_USERNAME'] = USERNAME;
        process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_PASSWORD'] = PASSWORD;
        return;
    }

    process.env['ENDPOINT_AUTH_' + endpoint] = JSON.stringify({
        scheme: 'Bearer',
        parameters: {}
    });
    process.env['ENDPOINT_AUTH_SCHEME_' + endpoint] = 'Bearer';
}

export function registerAllMocks(tr: tmrm.TaskMockRunner, options?: ScenarioOptions): void {
    const scenario = options || {};
    registerFsMock(tr, scenario.cleanupFixture === true, scenario.cleanupThrows === true);
    registerHttpsMock(tr, scenario.apiResponseText);
    registerSourceControlWrapperMock(tr, scenario);
}

export function clearEndpointAuth(): void {
    const endpoint = CONNECTION_ID;
    delete process.env['ENDPOINT_AUTH_' + endpoint];
    delete process.env['ENDPOINT_AUTH_SCHEME_' + endpoint];
    delete process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_APITOKEN'];
    delete process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_EMAIL'];
    delete process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_USERNAME'];
    delete process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_PASSWORD'];
}

function registerFsMock(tr: tmrm.TaskMockRunner, cleanupFixture: boolean, cleanupThrows: boolean): void {
    const realFs = require('fs');
    const mockFs: { [key: string]: unknown } = Object.assign({}, realFs);

    function normalizePath(p: string): string {
        return (p || '').replace(/\\/g, '/').replace(/^\.\//, '');
    }

    if (!cleanupFixture) {
        mockFs['existsSync'] = function () { return false; };
        tr.registerMock('fs', mockFs);
        return;
    }

    if (cleanupThrows) {
        mockFs['existsSync'] = function () { return true; };
        mockFs['lstatSync'] = function () {
            throw new Error('Simulated cleanup failure');
        };
        tr.registerMock('fs', mockFs);
        return;
    }

    mockFs['existsSync'] = function (_targetPath: string) {
        return true;
    };

    mockFs['lstatSync'] = function (targetPath: string) {
        const p = normalizePath(targetPath);
        const isDirectory = p === '' || p === '.' || p === 'sub';
        return {
            isDirectory: function () { return isDirectory; }
        };
    };

    mockFs['readdirSync'] = function (targetPath: string) {
        const p = normalizePath(targetPath);
        if (p === '' || p === '.') {
            return ['a.txt', 'sub'];
        }
        if (p === 'sub') {
            return ['b.txt'];
        }
        return [];
    };

    mockFs['unlinkSync'] = function (targetPath: string) {
        console.log('[mock-fs] unlink ' + normalizePath(targetPath));
    };

    mockFs['rmdirSync'] = function (targetPath: string) {
        const p = normalizePath(targetPath);
        console.log('[mock-fs] rmdir ' + (p || '.'));
    };

    tr.registerMock('fs', mockFs);
}

function registerHttpsMock(tr: tmrm.TaskMockRunner, apiResponseText?: string): void {
    tr.registerMock('https', {
        request: function (options: { [key: string]: string }, callback: Function) {
            const auth = options.auth || '';
            const authUser = auth.indexOf(':') >= 0 ? auth.split(':')[0] : auth;
            console.log('[mock-https] request ' + options.path + ' authUser=' + authUser);

            const response = new events.EventEmitter() as any;
            response.statusCode = 200;
            response.statusMessage = 'OK';
            callback(response);

            return {
                on: function (): unknown {
                    return this;
                },
                end: function () {
                    const responseBody = apiResponseText !== undefined
                        ? apiResponseText
                        : JSON.stringify({
                            scm: 'git',
                            links: {
                                clone: [
                                    { href: 'https://bitbucket.org/org/repo.git' }
                                ]
                            }
                        });

                    process.nextTick(function () {
                        response.emit('data', responseBody);
                        response.emit('end');
                    });
                }
            };
        }
    });
}

function registerSourceControlWrapperMock(tr: tmrm.TaskMockRunner, options: ScenarioOptions): void {
    let checkoutCall = 0;

    function sanitizeRepoUrl(repo: string): string {
        return repo.replace(/:\/\/[^@]+@/, '://***@');
    }

    class MockSourceControlWrapper extends events.EventEmitter {
        public username: string;
        public password: string;

        constructor(toolType: string) {
            super();
            this.username = '';
            this.password = '';
            console.log('[mock-scw] ctor tool=' + toolType);
        }

        public clone(repository: string, _progress: boolean, folder: string, _execOptions: unknown): Promise<number> {
            console.log('[mock-scw] clone ' + sanitizeRepoUrl(repository) + ' ' + folder);
            console.log('[mock-scw] auth user=' + this.username + ' passSet=' + (!!this.password));
            if (options.cloneFails) {
                return Promise.reject(new Error('Simulated clone failure'));
            }
            return Promise.resolve(0);
        }

        public checkout(ref: string, _execOptions?: unknown): Promise<number> {
            checkoutCall++;
            console.log('[mock-scw] checkout ' + ref);
            if (options.checkoutFailsAt && checkoutCall === options.checkoutFailsAt) {
                return Promise.reject(new Error('Simulated checkout failure'));
            }
            return Promise.resolve(0);
        }
    }

    tr.registerMock('./sourcecontrolwrapper.js', {
        SourceControlWrapper: MockSourceControlWrapper
    });
}
