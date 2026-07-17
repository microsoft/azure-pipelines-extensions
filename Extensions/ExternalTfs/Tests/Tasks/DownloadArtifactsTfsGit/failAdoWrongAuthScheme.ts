// For this scenario the REAL auth.js must run so its non-WIF scheme check
// throws. We deliberately do NOT register a ./auth mock; only the other
// dependencies (shelljs, gitwrapper, WebApi) are stubbed.

import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

import {
    ADO_CONNECTION_ID, PROJECT_ID, REPOSITORY_ID, DOWNLOAD_PATH,
    BRANCH_REGULAR, COMMIT_ID,
    setAdoEndpoint
} from './mockHelpers';

const taskPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'downloadTfGit.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('connectionType', 'ado');
tr.setInput('azureDevOpsServiceConnection', ADO_CONNECTION_ID);
tr.setInput('projectAdo', PROJECT_ID);
tr.setInput('definitionAdo', REPOSITORY_ID);
tr.setInput('branchAdo', BRANCH_REGULAR);
tr.setInput('versionAdo', COMMIT_ID);
tr.setInput('downloadPath', DOWNLOAD_PATH);

setAdoEndpoint('UsernamePassword');

const Q = require('q');
const events = require('events');

class MockGitWrapper extends events.EventEmitter {
    public username: string = '';
    public password: string = '';
    public clone(_repo: string, _progress: boolean, _folder: string, _options: unknown): unknown {
        const d = Q.defer();
        process.nextTick(() => d.resolve(0));
        return d.promise;
    }
    public fetch(_args: string[], _options: unknown): unknown {
        const d = Q.defer();
        process.nextTick(() => d.resolve(0));
        return d.promise;
    }
    public checkout(_ref: string, _options?: unknown): unknown {
        const d = Q.defer();
        process.nextTick(() => d.resolve(0));
        return d.promise;
    }
}
tr.registerMock('./gitwrapper', { GitWrapper: MockGitWrapper });

const realShell = require('shelljs');
tr.registerMock('shelljs', Object.assign({}, realShell, {
    rm: () => ({ code: 0 }),
    error: () => null,
    cd: () => { /* no-op */ },
    which: (cmd: string) => '/usr/bin/' + cmd,
    test: () => true,
    mkdir: () => { /* no-op */ },
    exec: (_c: string, cb: (code: number, stdout: string) => void) => {
        if (typeof cb === 'function') cb(0, '');
        return { code: 0, stdout: '' };
    }
}));

tr.registerMock('azure-devops-node-api/WebApi', {
    WebApi: function () {
        return { getGitApi: () => Promise.resolve({ getRepository: async () => ({ remoteUrl: 'https://example.com/_git/repo' }) }) };
    },
    getBasicHandler: () => ({ type: 'basic' }),
    getBearerHandler: () => ({ type: 'bearer' })
});

tr.run();
