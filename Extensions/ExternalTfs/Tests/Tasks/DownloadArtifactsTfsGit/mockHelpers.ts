// Shared mock builders for the DownloadArtifactsTfsGit suite.
//
// Each scenario file (success*.ts / fail*.ts) builds a TaskMockRunner, sets
// inputs and endpoint environment variables, registers mocks via the helpers
// below, and calls runner.run(). The mocks intentionally print structured
// markers to stdout so the _suite.ts driver can assert side-effects:
//   "[mock-git] clone <url> <folder>"
//   "[mock-git] fetch <args>"
//   "[mock-git] checkout <ref>"
//   "[mock-git] event:<name>"
//   "[mock-auth] wif <serviceConnection>"

import tmrm = require('azure-pipelines-task-lib/mock-run');

export const TFS_CONNECTION_ID = 'tfs-connection-id';
export const ADO_CONNECTION_ID = 'ado-connection-id';
export const PROJECT_ID = 'fff11111-2222-3333-4444-555566667777';
export const REPOSITORY_ID = 'aaa11111-2222-3333-4444-555566667777';
export const TFS_HOST_URL = 'https://tfs.example.local/DefaultCollection';
export const ADO_HOST_URL = 'https://dev.azure.com/contoso';
export const TFS_REMOTE_URL = TFS_HOST_URL + '/_git/myrepo';
export const ADO_REMOTE_URL = ADO_HOST_URL + '/project/_git/myrepo';
export const DOWNLOAD_PATH = '/tmp/external-tfs-git-download';
export const BRANCH_REGULAR = 'master';
export const BRANCH_PULL_REQUEST = 'refs/pull/42/merge';
export const COMMIT_ID = '1234567890abcdef1234567890abcdef12345678';
export const TFS_USERNAME = 'tfs-user';
export const TFS_PASSWORD = 'tfs-password';
export const TFS_TOKEN = 'tfs-pat-token';
export const ADO_ACCESS_TOKEN = 'ado-wif-access-token';

export type AuthSchemeFixture = 'Token' | 'UsernamePassword' | 'WorkloadIdentityFederation' | 'Unsupported';

export interface TfsEndpointOptions {
    scheme: AuthSchemeFixture;
    /** Override the URL emitted by tl.getEndpointUrl(). Empty string simulates missing. Undefined = unset env (also empty). */
    url?: string;
    /** When false, no ENDPOINT_AUTH env is set so tl.getEndpointAuthorization() returns null. */
    includeAuth?: boolean;
    /** Override parameter casing to exercise case-insensitive lookup. */
    useUppercaseParameters?: boolean;
}

export function setReposOrTfsEndpoint(opts: TfsEndpointOptions): void {
    const id = TFS_CONNECTION_ID;
    if (opts.url !== '') {
        process.env['ENDPOINT_URL_' + id] = opts.url ?? TFS_HOST_URL;
    } else {
        delete process.env['ENDPOINT_URL_' + id];
    }

    if (opts.includeAuth === false) {
        delete process.env['ENDPOINT_AUTH_' + id];
        delete process.env['ENDPOINT_AUTH_SCHEME_' + id];
        return;
    }

    const u = !!opts.useUppercaseParameters;
    if (opts.scheme === 'Token') {
        const tokenKey = u ? 'APITOKEN' : 'apitoken';
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'Token',
            parameters: { [tokenKey]: TFS_TOKEN }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'Token';
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_APITOKEN'] = TFS_TOKEN;
    } else if (opts.scheme === 'UsernamePassword') {
        const userKey = u ? 'USERNAME' : 'username';
        const passKey = u ? 'PASSWORD' : 'password';
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'UsernamePassword',
            parameters: { [userKey]: TFS_USERNAME, [passKey]: TFS_PASSWORD }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'UsernamePassword';
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_USERNAME'] = TFS_USERNAME;
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_PASSWORD'] = TFS_PASSWORD;
    } else {
        // Unsupported scheme: caller-controlled label.
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'Bearer',
            parameters: {}
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'Bearer';
    }
}

export function setAdoEndpoint(scheme: AuthSchemeFixture): void {
    const id = ADO_CONNECTION_ID;
    process.env['ENDPOINT_URL_' + id] = ADO_HOST_URL;
    const schemeName = scheme === 'WorkloadIdentityFederation' ? 'WorkloadIdentityFederation' : 'UsernamePassword';
    process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
        scheme: schemeName,
        parameters: {
            serviceprincipalid: 'sp-id',
            tenantid: 'tenant-id'
        }
    });
    process.env['ENDPOINT_AUTH_SCHEME_' + id] = schemeName;
    process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_SERVICEPRINCIPALID'] = 'sp-id';
    process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_TENANTID'] = 'tenant-id';
    process.env['ENDPOINT_DATA_' + id + '_ACTIVEDIRECTORYAUTHORITY'] = 'https://login.microsoftonline.com/';
}

export interface GitWrapperMockOptions {
    /** Number of times .clone() should reject before succeeding. */
    cloneFailures?: number;
    /** When true, .clone() rejects on every call. */
    cloneAlwaysFails?: boolean;
    /** Forces .checkout() to reject on its first invocation. */
    checkoutFailsOnce?: boolean;
}

export interface WebApiMockOptions {
    /** When true, getRepository() resolves with `undefined` to exercise the null-repo guard. */
    nullRepo?: boolean;
    /** When true, getRepository() resolves with a repo lacking remoteUrl. */
    missingRemoteUrl?: boolean;
    /** Override the remoteUrl returned. */
    remoteUrl?: string;
}

export interface RegisterAllMocksOptions {
    gitWrapper?: GitWrapperMockOptions;
    webApi?: WebApiMockOptions;
    /** Override the access token returned from getAccessTokenViaWorkloadIdentityFederation. Undefined = no-op (use default 'ADO_ACCESS_TOKEN'). */
    adoAccessToken?: string | null;
}

export function registerAllMocks(tr: tmrm.TaskMockRunner, opts: RegisterAllMocksOptions = {}): void {
    registerShellMock(tr);
    registerGitWrapperMock(tr, opts.gitWrapper);
    registerAuthMock(tr, opts.adoAccessToken);
    registerWebApiMock(tr, opts.webApi);
    // Q is a real transitive dep; do not mock it. setTimeout compression is
    // installed only when callers explicitly want fast retries.
}

export function compressSetTimeout(): void {
    const realSetTimeout = global.setTimeout;
    (global as any).setTimeout = (fn: (...args: unknown[]) => void, ms: number, ...args: unknown[]) => {
        return realSetTimeout(fn, Math.min(ms, 5) as unknown as number, ...args);
    };
}

function registerShellMock(tr: tmrm.TaskMockRunner): void {
    const realShell = require('shelljs');
    const mockShell: { [key: string]: unknown } = Object.assign({}, realShell);
    mockShell['rm'] = (..._args: unknown[]) => {
        console.log('[mock-shell] rm ' + _args.map(String).join(' '));
        return { code: 0 } as unknown;
    };
    mockShell['error'] = () => null;
    mockShell['cd'] = (dir: string) => { console.log('[mock-shell] cd ' + dir); };
    mockShell['which'] = (cmd: string, _required?: boolean) => '/usr/bin/' + cmd;
    mockShell['test'] = (_flag: string, _path: string) => true;
    mockShell['mkdir'] = (..._args: unknown[]) => { console.log('[mock-shell] mkdir ' + _args.map(String).join(' ')); };
    mockShell['exec'] = (cmd: string, cb: (code: number, stdout: string) => void) => {
        console.log('[mock-shell] exec ' + cmd);
        if (typeof cb === 'function') cb(0, '');
        return { code: 0, stdout: '' } as unknown;
    };
    tr.registerMock('shelljs', mockShell);
}

function registerGitWrapperMock(tr: tmrm.TaskMockRunner, opts: GitWrapperMockOptions = {}): void {
    const Q = require('q');
    const events = require('events');

    let cloneAttempts = 0;
    let checkoutAttempts = 0;

    class MockGitWrapper extends events.EventEmitter {
        public username: string = '';
        public password: string = '';
        public gitInstalled: boolean = true;

        constructor() { super(); }

        public clone(repo: string, _progress: boolean, folder: string, _options: unknown): unknown {
            cloneAttempts++;
            console.log('[mock-git] clone-attempt ' + cloneAttempts);
            const sanitized = repo.replace(/:\/\/[^@]+@/, '://***@');
            console.log('[mock-git] clone ' + sanitized + ' ' + folder);
            const deferred = Q.defer();
            const shouldFail = !!opts.cloneAlwaysFails || (cloneAttempts <= (opts.cloneFailures || 0));
            if (shouldFail) {
                process.nextTick(() => deferred.reject(new Error('Simulated git clone failure attempt ' + cloneAttempts)));
            } else {
                process.nextTick(() => deferred.resolve(0));
            }
            return deferred.promise;
        }

        public fetch(args: string[], _options: unknown): unknown {
            console.log('[mock-git] fetch ' + args.join(' '));
            const deferred = Q.defer();
            process.nextTick(() => deferred.resolve(0));
            return deferred.promise;
        }

        public checkout(ref: string, _options?: unknown): unknown {
            checkoutAttempts++;
            console.log('[mock-git] checkout ' + ref);
            const deferred = Q.defer();
            if (opts.checkoutFailsOnce && checkoutAttempts === 1) {
                process.nextTick(() => deferred.reject(new Error('Simulated checkout failure')));
            } else {
                process.nextTick(() => deferred.resolve(0));
            }
            return deferred.promise;
        }
    }

    tr.registerMock('./gitwrapper', { GitWrapper: MockGitWrapper });
}

function registerAuthMock(tr: tmrm.TaskMockRunner, accessToken: string | null | undefined): void {
    const token = accessToken === undefined ? ADO_ACCESS_TOKEN : accessToken;
    tr.registerMock('./auth', {
        getAccessTokenViaWorkloadIdentityFederation: async (serviceConnection: string) => {
            console.log('[mock-auth] wif ' + serviceConnection);
            // null is treated as "WIF resolved without producing a token" — exercises
            // the downstream `if (!connectionDetails.Password) throw` guard. Use the
            // dedicated `wifAuthThrows` knob (see registerAllMocks) for the throw case.
            return token;
        }
    });
}

function registerWebApiMock(tr: tmrm.TaskMockRunner, opts: WebApiMockOptions = {}): void {
    const fakeGitApi = {
        getRepository: async (repoId: string, projectId: string) => {
            console.log('[mock-webapi] getRepository ' + repoId + ' ' + projectId);
            if (opts.nullRepo) {
                return undefined;
            }
            if (opts.missingRemoteUrl) {
                return { id: repoId, name: 'myrepo', remoteUrl: undefined };
            }
            const remoteUrl = opts.remoteUrl ?? TFS_REMOTE_URL;
            return { id: repoId, name: 'myrepo', remoteUrl };
        }
    };

    function FakeWebApi(this: any, url: string, handler: unknown) {
        console.log('[mock-webapi] WebApi ' + url + ' handler=' + JSON.stringify(handler));
        return {
            getGitApi: () => Promise.resolve(fakeGitApi)
        };
    }

    tr.registerMock('azure-devops-node-api/WebApi', {
        WebApi: FakeWebApi,
        getBasicHandler: (user: string, _pass: string) => {
            console.log('[mock-webapi] getBasicHandler user=' + user);
            return { type: 'basic', user };
        },
        getBearerHandler: (_token: string, allowCrossOrigin?: boolean) => {
            console.log('[mock-webapi] getBearerHandler allowCrossOrigin=' + !!allowCrossOrigin);
            return { type: 'bearer' };
        }
    });
}
