// Shared mock builders for the DownloadExternalBuildArtifacts suite.
//
// The task imports:
//   azure-devops-node-api/WebApi           -> WebApi + getBasicHandler
//   artifact-engine/Engine                 -> ArtifactEngine, ArtifactEngineOptions
//   artifact-engine/Providers              -> FilesystemProvider, WebProvider
//   artifact-engine/Providers/typed-rest-client/Handlers
//                                          -> BasicCredentialHandler, PersonalAccessTokenCredentialHandler
//   ./auth                                 -> getAccessTokenViaWorkloadIdentityFederation
//
// All of the above are stubbed here. Mock side-effects are emitted to stdout
// under markers the _suite.ts driver asserts on:
//   "[mock-buildapi] getArtifacts <projectId> <buildId>"
//   "[mock-engine] processItems pattern=<glob> verbose=<bool>"
//   "[mock-providers] WebProvider <itemsUrl>"
//   "[mock-providers] FilesystemProvider <destPath>"
//   "[mock-handlers] BasicCredentialHandler user=<user>"
//   "[mock-handlers] PersonalAccessTokenCredentialHandler"
//   "[mock-auth] wif <serviceConnection>"

import tmrm = require('azure-pipelines-task-lib/mock-run');

export const TFS_CONNECTION_ID = 'tfs-connection-id';
export const ADO_CONNECTION_ID = 'ado-connection-id';
export const PROJECT_ID = 'fff11111-2222-3333-4444-555566667777';
export const BUILD_ID = '42';
export const ADO_BUILD_ID = '4242';
export const TFS_HOST_URL = 'https://tfs.example.local/DefaultCollection';
export const ADO_HOST_URL = 'https://dev.azure.com/contoso';
export const DOWNLOAD_PATH = '/tmp/external-build-artifacts';
export const TFS_USERNAME = 'tfs-user';
export const TFS_PASSWORD = 'tfs-password';
export const TFS_TOKEN = 'tfs-pat-token';
export const ADO_ACCESS_TOKEN = 'ado-wif-access-token';

export type AuthSchemeFixture = 'Token' | 'UsernamePassword' | 'WorkloadIdentityFederation';

export interface TfsEndpointOptions {
    /** When 'token' the apitoken parameter is supplied; when 'usernamepassword' user+pass. */
    scheme: AuthSchemeFixture;
}

export function setTfsEndpoint(opts: TfsEndpointOptions): void {
    const id = TFS_CONNECTION_ID;
    process.env['ENDPOINT_URL_' + id] = TFS_HOST_URL;
    if (opts.scheme === 'Token') {
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'Token',
            parameters: { apitoken: TFS_TOKEN }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'Token';
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_APITOKEN'] = TFS_TOKEN;
    } else {
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'UsernamePassword',
            parameters: { username: TFS_USERNAME, password: TFS_PASSWORD }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'UsernamePassword';
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_USERNAME'] = TFS_USERNAME;
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_PASSWORD'] = TFS_PASSWORD;
    }
}

export function setAdoEndpoint(): void {
    const id = ADO_CONNECTION_ID;
    process.env['ENDPOINT_URL_' + id] = ADO_HOST_URL;
    process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
        scheme: 'WorkloadIdentityFederation',
        parameters: {
            serviceprincipalid: 'sp-id',
            tenantid: 'tenant-id'
        }
    });
    process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'WorkloadIdentityFederation';
    process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_SERVICEPRINCIPALID'] = 'sp-id';
    process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_TENANTID'] = 'tenant-id';
}

export type ArtifactFixture =
    | { type: 'container'; name: string; data: string }
    | { type: 'filepath'; name: string; data: string }
    | { type: string; name: string; data: string };

export interface RegisterAllMocksOptions {
    /** Override the array of artifacts returned by buildApi.getArtifacts(). */
    artifacts?: ArtifactFixture[];
    /** Override the access token returned by ./auth's WIF helper. */
    adoAccessToken?: string;
    /** When true, processItems() rejects (download fails). */
    downloadFails?: boolean;
    /** Number of times getArtifacts() rejects before succeeding. */
    getArtifactsFailures?: number;
    /** When true, getArtifacts() rejects on every call. */
    getArtifactsAlwaysFails?: boolean;
}

export function compressSetTimeout(): void {
    const realSetTimeout = global.setTimeout;
    (global as any).setTimeout = (fn: (...args: unknown[]) => void, ms: number, ...args: unknown[]) => {
        return realSetTimeout(fn, Math.min(ms, 5) as unknown as number, ...args);
    };
}

export function registerAllMocks(tr: tmrm.TaskMockRunner, opts: RegisterAllMocksOptions = {}): void {
    registerWebApiMock(tr, opts);
    registerArtifactEngineMock(tr, opts.downloadFails);
    registerProvidersMock(tr);
    registerHandlersMock(tr);
    registerAuthMock(tr, opts.adoAccessToken);
}

function registerWebApiMock(tr: tmrm.TaskMockRunner, opts: RegisterAllMocksOptions): void {
    const resolvedArtifacts: ArtifactFixture[] = opts.artifacts || [{
        type: 'container',
        name: 'drop',
        data: '#/123/drop'
    }];
    let getArtifactsAttempts = 0;

    const fakeBuildApi = {
        getArtifacts: async (projectId: string, buildId: number) => {
            getArtifactsAttempts++;
            console.log('[mock-buildapi] getArtifacts-attempt ' + getArtifactsAttempts);
            console.log('[mock-buildapi] getArtifacts ' + projectId + ' ' + buildId);
            const shouldFail = !!opts.getArtifactsAlwaysFails || (getArtifactsAttempts <= (opts.getArtifactsFailures || 0));
            if (shouldFail) {
                throw new Error('Simulated getArtifacts failure attempt ' + getArtifactsAttempts);
            }
            return resolvedArtifacts.map(a => ({ name: a.name, resource: { type: a.type, data: a.data } }));
        }
    };

    function FakeWebApi(this: any, url: string, _handler: unknown) {
        console.log('[mock-webapi] WebApi ' + url);
        return {
            getBuildApi: async () => fakeBuildApi
        };
    }

    tr.registerMock('azure-devops-node-api/WebApi', {
        WebApi: FakeWebApi,
        getBasicHandler: (user: string, _pass: string) => {
            console.log('[mock-webapi] getBasicHandler user=' + user);
            return { type: 'basic', user };
        }
    });
}

function registerArtifactEngineMock(tr: tmrm.TaskMockRunner, downloadFails?: boolean): void {
    class MockArtifactEngineOptions {
        public itemPattern: string = '';
        public verbose: boolean = false;
        public parallelProcessingLimit: number = 0;
    }
    class MockArtifactEngine {
        public processItems(_provider: unknown, _destProvider: unknown, options: MockArtifactEngineOptions): Promise<number> {
            console.log('[mock-engine] processItems pattern=' + (options.itemPattern || '') + ' verbose=' + !!options.verbose);
            if (downloadFails) {
                return Promise.reject(new Error('Simulated download failure'));
            }
            return Promise.resolve(0);
        }
    }

    tr.registerMock('artifact-engine/Engine', {
        ArtifactEngine: MockArtifactEngine,
        ArtifactEngineOptions: MockArtifactEngineOptions
    });
}

function registerProvidersMock(tr: tmrm.TaskMockRunner): void {
    function WebProvider(this: any, itemsUrl: string, _template: string, _vars: unknown, _handler: unknown) {
        console.log('[mock-providers] WebProvider ' + itemsUrl);
    }
    function FilesystemProvider(this: any, destPath: string) {
        console.log('[mock-providers] FilesystemProvider ' + destPath);
    }
    tr.registerMock('artifact-engine/Providers', {
        WebProvider,
        FilesystemProvider
    });
}

function registerHandlersMock(tr: tmrm.TaskMockRunner): void {
    function BasicCredentialHandler(this: any, user: string, _pass: string) {
        console.log('[mock-handlers] BasicCredentialHandler user=' + user);
    }
    function PersonalAccessTokenCredentialHandler(this: any, _token: string) {
        console.log('[mock-handlers] PersonalAccessTokenCredentialHandler');
    }
    tr.registerMock('artifact-engine/Providers/typed-rest-client/Handlers', {
        BasicCredentialHandler,
        PersonalAccessTokenCredentialHandler
    });
}

function registerAuthMock(tr: tmrm.TaskMockRunner, accessToken: string | undefined): void {
    const token = accessToken || ADO_ACCESS_TOKEN;
    tr.registerMock('./auth', {
        getAccessTokenViaWorkloadIdentityFederation: async (serviceConnection: string) => {
            console.log('[mock-auth] wif ' + serviceConnection);
            return token;
        }
    });
}
