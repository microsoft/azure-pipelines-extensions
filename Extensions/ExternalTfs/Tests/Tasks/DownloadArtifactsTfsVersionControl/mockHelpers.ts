// Shared mock builders for the DownloadArtifactsTfsVersionControl suite.
//
// The task uses azure-pipelines-task-lib + a TfvcWrapper around the `tf`
// (Team Explorer Everywhere / VS) CLI. Tests stub TfvcWrapper to control
// the workspace / mapping / sync paths and shelljs to avoid touching the
// host file system. Mock side-effects are emitted to stdout under markers
// the _suite.ts driver asserts on:
//   "[mock-tfvc] deleteWorkspace <name>"
//   "[mock-tfvc] newWorkspace <name>"
//   "[mock-tfvc] mapFolder <server> <local>"
//   "[mock-tfvc] get <changeset>"
//   "[mock-tfvc] listWorkspaces"

import tmrm = require('azure-pipelines-task-lib/mock-run');

export const CONNECTION_ID = 'tfvc-connection-id';
export const HOST_URL = 'https://tfs.example.local/DefaultCollection';
export const PROJECT_ID = 'tfvc-project-id';
export const REPOSITORY_ID = 'tfvc-repo-id';
export const DOWNLOAD_PATH = '/tmp/external-tfs-tfvc-download';
export const CHANGESET_ID = '12345';
export const TFS_USERNAME = 'tfs-user';
export const TFS_PASSWORD = 'tfs-password';
export const TFS_TOKEN = 'tfs-pat-token';

export type AuthSchemeFixture = 'Token' | 'UsernamePassword' | 'Unsupported';

export interface EndpointOptions {
    scheme: AuthSchemeFixture;
    /** When false, ENDPOINT_AUTH env is not set so getEndpointAuthorization() returns null. */
    includeAuth?: boolean;
}

export function setEndpoint(opts: EndpointOptions): void {
    const id = CONNECTION_ID;
    process.env['ENDPOINT_URL_' + id] = HOST_URL;

    if (opts.includeAuth === false) {
        delete process.env['ENDPOINT_AUTH_' + id];
        delete process.env['ENDPOINT_AUTH_SCHEME_' + id];
        return;
    }

    if (opts.scheme === 'Token') {
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'Token',
            parameters: { apitoken: TFS_TOKEN }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'Token';
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_APITOKEN'] = TFS_TOKEN;
    } else if (opts.scheme === 'UsernamePassword') {
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'UsernamePassword',
            parameters: { username: TFS_USERNAME, password: TFS_PASSWORD }
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'UsernamePassword';
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_USERNAME'] = TFS_USERNAME;
        process.env['ENDPOINT_AUTH_PARAMETER_' + id + '_PASSWORD'] = TFS_PASSWORD;
    } else {
        process.env['ENDPOINT_AUTH_' + id] = JSON.stringify({
            scheme: 'Bearer',
            parameters: {}
        });
        process.env['ENDPOINT_AUTH_SCHEME_' + id] = 'Bearer';
    }
}

export interface TfvcWrapperMockOptions {
    /** When true, deleteWorkspace() rejects (simulating no existing workspace). */
    deleteWorkspaceFails?: boolean;
    /** When true, newWorkspace() rejects. */
    newWorkspaceFails?: boolean;
    /** When true, mapFolder() rejects. */
    mapFolderFails?: boolean;
    /** When true, get() rejects. */
    getFails?: boolean;
}

export interface RegisterAllMocksOptions {
    tfvcWrapper?: TfvcWrapperMockOptions;
    /** Override path existence test return value. */
    pathExists?: boolean;
}

export function registerAllMocks(tr: tmrm.TaskMockRunner, opts: RegisterAllMocksOptions = {}): void {
    registerShellMock(tr, opts.pathExists);
    registerTfvcWrapperMock(tr, opts.tfvcWrapper);
}

function registerShellMock(tr: tmrm.TaskMockRunner, pathExists?: boolean): void {
    const realShell = require('shelljs');
    const mockShell: { [key: string]: unknown } = Object.assign({}, realShell);
    const pathTestResult = pathExists !== undefined ? pathExists : true;
    mockShell['rm'] = (..._args: unknown[]) => {
        console.log('[mock-shell] rm ' + _args.map(String).join(' '));
        return { code: 0 } as unknown;
    };
    mockShell['error'] = () => null;
    mockShell['cd'] = (dir: string) => { console.log('[mock-shell] cd ' + dir); };
    mockShell['which'] = (cmd: string, _required?: boolean) => '/usr/bin/' + cmd;
    mockShell['test'] = (_flag: string, _path: string) => pathTestResult;
    mockShell['mkdir'] = (..._args: unknown[]) => { console.log('[mock-shell] mkdir ' + _args.map(String).join(' ')); };
    mockShell['exec'] = (cmd: string, cb: (code: number, stdout: string) => void) => {
        console.log('[mock-shell] exec ' + cmd);
        if (typeof cb === 'function') cb(0, '');
        return { code: 0, stdout: '' } as unknown;
    };
    tr.registerMock('shelljs', mockShell);
}

function registerTfvcWrapperMock(tr: tmrm.TaskMockRunner, opts: TfvcWrapperMockOptions = {}): void {
    const Q = require('q');
    const events = require('events');

    class MockTfvcWrapper extends events.EventEmitter {
        public setTfvcConnOptions(options: { collection?: string; username?: string; password?: string }): void {
            console.log('[mock-tfvc] setTfvcConnOptions collection=' + (options.collection || '') + ' user=' + (options.username || ''));
        }
        public deleteWorkspace(workspace: { name: string }): unknown {
            console.log('[mock-tfvc] deleteWorkspace ' + workspace.name);
            const d = Q.defer();
            if (opts.deleteWorkspaceFails) {
                process.nextTick(() => d.reject(new Error('Simulated deleteWorkspace failure')));
            } else {
                process.nextTick(() => d.resolve(0));
            }
            return d.promise;
        }
        public newWorkspace(workspace: { name: string }): unknown {
            console.log('[mock-tfvc] newWorkspace ' + workspace.name);
            const d = Q.defer();
            if (opts.newWorkspaceFails) {
                process.nextTick(() => d.reject(new Error('Simulated newWorkspace failure')));
            } else {
                process.nextTick(() => d.resolve(0));
            }
            return d.promise;
        }
        public mapFolder(serverPath: string, localPath: string, _workspace: { name: string }): unknown {
            console.log('[mock-tfvc] mapFolder ' + serverPath + ' ' + localPath);
            const d = Q.defer();
            if (opts.mapFolderFails) {
                process.nextTick(() => d.reject(new Error('Simulated mapFolder failure')));
            } else {
                process.nextTick(() => d.resolve(0));
            }
            return d.promise;
        }
        public get(version: string | undefined): unknown {
            console.log('[mock-tfvc] get ' + (version || '<latest>'));
            const d = Q.defer();
            if (opts.getFails) {
                process.nextTick(() => d.reject(new Error('Simulated get failure')));
            } else {
                process.nextTick(() => d.resolve(0));
            }
            return d.promise;
        }
        public listWorkspaces(): unknown {
            console.log('[mock-tfvc] listWorkspaces');
            return 0;
        }
    }

    tr.registerMock('./tfvcwrapper', { TfvcWrapper: MockTfvcWrapper });
}
