import tmrm = require('azure-pipelines-task-lib/mock-run');

// -- Shared constants ----------------------------------------------------------

export const CONNECTION_ID = 'teamcity-connection-id';
export const TEAMCITY_URL = 'https://teamcity.example.com';
export const USERNAME = 'tc-user';
export const PASSWORD = 'tc-pass';
export const PROJECT_ID = 'TeamCityDemoProject';
export const DEFINITION_ID = 'TeamCityDemoProject_Build';
export const BUILD_ID = '42';
export const DOWNLOAD_PATH = 'artifacts';
export const ITEM_PATTERN_CUSTOM = '**/*.zip';

// -- Scenario knobs ------------------------------------------------------------

export interface ScenarioOptions {
    // When set, the mock ArtifactEngine rejects processItems() with an error carrying
    // this HTTP status code (used to simulate 404/401/400 from TeamCity/S3).
    downloadFailStatusCode?: number;
    // Custom error message on the rejection. Defaults to "Failed request".
    downloadFailMessage?: string;
}

// -- Input helpers -------------------------------------------------------------

export function setRequiredInputs(
    tr: tmrm.TaskMockRunner,
    overrides?: { [key: string]: string | undefined }
): void {
    const inputMap: { [key: string]: string | undefined } = {
        connection: CONNECTION_ID,
        project: PROJECT_ID,
        definition: DEFINITION_ID,
        version: BUILD_ID,
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

// -- Endpoint auth (UsernamePassword scheme — the only one TeamCity supports) --

export function setEndpointAuth(username?: string, password?: string): void {
    const endpoint = CONNECTION_ID;
    const u = username !== undefined ? username : USERNAME;
    const p = password !== undefined ? password : PASSWORD;

    process.env['ENDPOINT_URL_' + endpoint] = TEAMCITY_URL;
    process.env['ENDPOINT_AUTH_' + endpoint] = JSON.stringify({
        scheme: 'UsernamePassword',
        parameters: { username: u, password: p }
    });
    process.env['ENDPOINT_AUTH_SCHEME_' + endpoint] = 'UsernamePassword';
    process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_USERNAME'] = u;
    process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_PASSWORD'] = p;
}

export function clearEndpointAuth(): void {
    const endpoint = CONNECTION_ID;
    delete process.env['ENDPOINT_URL_' + endpoint];
    delete process.env['ENDPOINT_AUTH_' + endpoint];
    delete process.env['ENDPOINT_AUTH_SCHEME_' + endpoint];
    delete process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_USERNAME'];
    delete process.env['ENDPOINT_AUTH_PARAMETER_' + endpoint + '_PASSWORD'];
}

// -- Module mocks --------------------------------------------------------------

export function registerAllMocks(tr: tmrm.TaskMockRunner, options?: ScenarioOptions): void {
    registerArtifactEngineMocks(tr, options || {});
}

function registerArtifactEngineMocks(tr: tmrm.TaskMockRunner, options: ScenarioOptions): void {
    class MockArtifactEngineOptions {
        public itemPattern: string = '';
        public verbose: boolean = false;
        public parallelProcessingLimit: number = 4;
    }

    class MockArtifactEngine {
        public processItems(webProvider: any, fsProvider: any, opts: MockArtifactEngineOptions): Promise<void> {
            console.log('[mock-artifact-engine] processItems itemPattern=' + opts.itemPattern);
            console.log('[mock-artifact-engine] processItems parallelLimit=' + opts.parallelProcessingLimit);
            console.log('[mock-artifact-engine] processItems verbose=' + opts.verbose);
            console.log('[mock-artifact-engine] webProviderUrl=' + (webProvider && webProvider.url));
            console.log('[mock-artifact-engine] fsProviderPath=' + (fsProvider && fsProvider.rootPath));

            if (options.downloadFailStatusCode) {
                const err: any = new Error(options.downloadFailMessage || 'Failed request');
                err.statusCode = options.downloadFailStatusCode;
                err.httpStatusCode = options.downloadFailStatusCode;
                return Promise.reject(err);
            }
            return Promise.resolve();
        }
    }

    tr.registerMock('artifact-engine/Engine', {
        ArtifactEngine: MockArtifactEngine,
        ArtifactEngineOptions: MockArtifactEngineOptions
    });

    class MockWebProvider {
        public url: string;
        public templatePath: string;
        public variables: any;
        public handler: any;
        constructor(url: string, templatePath: string, variables: any, handler: any) {
            this.url = url;
            this.templatePath = templatePath;
            this.variables = variables;
            this.handler = handler;
            console.log('[mock-web-provider] ctor url=' + url);
            console.log('[mock-web-provider] handlerUser=' + (handler && handler.username) + ' handlerPassSet=' + !!(handler && handler.password));
        }
    }

    class MockFilesystemProvider {
        public rootPath: string;
        constructor(rootPath: string) {
            this.rootPath = rootPath;
            console.log('[mock-fs-provider] ctor path=' + rootPath);
        }
    }

    tr.registerMock('artifact-engine/Providers', {
        WebProvider: MockWebProvider,
        FilesystemProvider: MockFilesystemProvider
    });

    class MockBasicCredentialHandler {
        public username: string;
        public password: string;
        constructor(username: string, password: string) {
            this.username = username;
            this.password = password;
            console.log('[mock-basic-handler] ctor user=' + username + ' passSet=' + !!password);
        }
    }

    tr.registerMock('artifact-engine/Providers/typed-rest-client/Handlers', {
        BasicCredentialHandler: MockBasicCredentialHandler
    });
}
