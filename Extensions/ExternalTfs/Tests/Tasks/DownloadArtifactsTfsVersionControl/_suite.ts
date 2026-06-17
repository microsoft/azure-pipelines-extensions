// Mocha suite for DownloadArtifactsTfsVersionControl.
//
// Each scenario file is a `.ts` source under this directory; gulp `compileTests`
// transpiles them into `.js` under `_build/Extensions/.../Tests/Tasks/DownloadArtifactsTfsVersionControl/`.
// MockTestRunner spawns a child Node process to run the compiled `.js`,
// which is why this driver references `<scenario>.js` paths.
//
// task.json on master declares only the bare `Node` execution handler
// (== Node 6, long EOL). Node 6 binaries from nodejs.org/dist are unreliable
// to download in CI, so we run the scenarios under one stable modern Node
// instead: this still validates the task source's behavior (all of which is
// plain require()/Q/shelljs and works on any Node >= 6).
// When the support for new Node versions is introduced, this driver will
// pick them up automatically without code changes.

import assert = require('assert');
import path = require('path');
import fs = require('fs');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mocktest = require('azure-pipelines-task-lib/mock-test');

const taskJsonPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsVersionControl', 'task.json');

// Fallback Node version used when task.json declares only EOL handlers
// (Node 6) whose binaries can no longer be reliably downloaded. Picked to
// match a runtime that real agents ship today.
const FALLBACK_NODE_VERSION = 20;

function getTestableNodeVersions(): number[] {
    const taskJson = JSON.parse(fs.readFileSync(taskJsonPath, 'utf-8'));
    const versions = new Set<number>();
    const exec = taskJson.execution || {};
    for (const key of Object.keys(exec)) {
        const m = /^Node(\d*)/i.exec(key);
        if (!m) continue;
        const v = parseInt(m[1], 10) || 6;
        if (v < 10) continue; // Node 6 binaries are not reliably downloadable.
        versions.add(v);
    }
    if (versions.size === 0) {
        return [FALLBACK_NODE_VERSION];
    }
    return Array.from(versions).sort((a, b) => a - b);
}

function newRunner(scenario: string): any {
    const testPath = path.join(__dirname, scenario + '.js');
    return new mocktest.MockTestRunner(testPath, taskJsonPath);
}

async function runAndDump(runner: any, nodeVersion: number): Promise<void> {
    try {
        await runner.runAsync(nodeVersion);
    } catch (err) {
        console.log('--- runner threw ---');
        console.log(err);
        throw err;
    }
}

function fail(runner: any, msg: string): never {
    console.log('--- STDOUT ---');
    console.log(runner.stdout);
    console.log('--- STDERR ---');
    console.log(runner.stderr);
    throw new Error(msg);
}

const nodeVersions = getTestableNodeVersions();

describe('DownloadArtifactsTfsVersionControl Suite', function () {
    this.timeout(120000);

    nodeVersions.forEach(function (nodeVersion) {
        describe('Node ' + nodeVersion, function () {

            // ---- Success scenarios -----------------------------------------

            it('runs full TFVC sync flow with Token auth and explicit changeset', async function () {
                const runner = newRunner('successTokenAuth');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-tfvc] setTfvcConnOptions collection=https://tfs.example.local/DefaultCollection user=.'), 'should configure TFVC client with Token-scheme username "."');
                assert(runner.stdOutContained('[mock-tfvc] deleteWorkspace ws_external-tfs-tfvc-download'), 'should attempt to delete previous workspace');
                assert(runner.stdOutContained('[mock-tfvc] newWorkspace ws_external-tfs-tfvc-download'), 'should create new workspace');
                assert(runner.stdOutContained('[mock-tfvc] mapFolder $/tfvc-repo-id ' + '/tmp/external-tfs-tfvc-download'), 'should map server path to local path');
                assert(runner.stdOutContained('[mock-tfvc] get 12345'), 'should sync to the requested changeset');
                assert(runner.stdOutContained('Successfully synced workspace'), 'should log success');
            });

            it('runs full TFVC sync flow with UsernamePassword auth and latest changeset', async function () {
                const runner = newRunner('successUserPassLatest');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-tfvc] setTfvcConnOptions collection=https://tfs.example.local/DefaultCollection user=tfs-user'), 'should configure TFVC client with provided username');
                assert(runner.stdOutContained('[mock-tfvc] get <latest>'), 'should sync to latest when no changeset is provided');
                assert(runner.stdOutContained('Getting latest changeset as no changeset is specified'), 'should log latest-changeset message');
                assert(runner.stdOutContained('##vso[task.setsecret]tfs-password'), 'password must be registered as a secret via tl.setSecret');
            });

            it('tolerates deleteWorkspace failure (non-existent workspace) and continues', async function () {
                const runner = newRunner('successDeleteWorkspaceTolerated');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed despite delete failure');
                assert(runner.stdOutContained('Warning: Failed to delete Workspace'), 'should log a warning when delete fails');
                assert(runner.stdOutContained('[mock-tfvc] newWorkspace'), 'should still create new workspace');
                assert(runner.stdOutContained('Successfully synced workspace'), 'should still sync workspace');
            });

            // ---- Failure / validation scenarios ----------------------------

            it('fails when project input is missing', async function () {
                const runner = newRunner('failMissingProject');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing project');
                assert(runner.stdOutContained('Input required: project'), 'expected required-input error for project');
            });

            it('fails when definition (repository) input is missing', async function () {
                const runner = newRunner('failMissingDefinition');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing definition');
                assert(runner.stdOutContained('Input required: definition'), 'expected required-input error for definition');
            });

            it('fails when downloadPath input is missing', async function () {
                const runner = newRunner('failMissingDownloadPath');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing downloadPath');
                assert(runner.stdOutContained('Input required: downloadPath'), 'expected required-input error for downloadPath');
            });

            it('fails when endpoint authorization is missing', async function () {
                const runner = newRunner('failNoEndpointAuthorization');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing endpoint auth');
                assert(runner.stdOutContained('Could not decode the External Tfs endpoint'), 'expected External-Tfs endpoint decode error');
            });

            it('fails when authorization scheme is unsupported', async function () {
                const runner = newRunner('failUnsupportedAuthScheme');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for unsupported scheme');
                assert(runner.stdOutContained('not supported for a External Tfs endpoint'), 'expected unsupported-scheme error');
            });

            it('fails when connection input is missing', async function () {
                const runner = newRunner('failMissingConnection');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing connection');
                assert(runner.stdOutContained('Could not decode the External Tfs endpoint'), 'expected External-Tfs endpoint decode error');
            });

            it('logs error when newWorkspace fails', async function () {
                const runner = newRunner('failNewWorkspaceFails');
                await runAndDump(runner, nodeVersion);
                // The task calls tl.error(...) then process.exit(1) without setResult,
                // so runner.succeeded may stay true; assert the captured error issue
                // and that the get/sync step never ran.
                assert(runner.createdErrorIssue('Failed to Create a new Workspace. Error: Simulated newWorkspace failure'),
                    'expected tl.error issue describing newWorkspace failure');
                assert(!runner.stdOutContained('[mock-tfvc] get '), 'should not proceed to get/sync after newWorkspace failure');
            });

            it('logs error when mapFolder fails', async function () {
                const runner = newRunner('failMapFolderFails');
                await runAndDump(runner, nodeVersion);
                assert(runner.createdErrorIssue('Failed to add default mapping. Error: Simulated mapFolder failure'),
                    'expected tl.error issue describing mapFolder failure');
                assert(!runner.stdOutContained('[mock-tfvc] get '), 'should not proceed to get/sync after mapFolder failure');
            });

            it('logs error when get/sync fails', async function () {
                const runner = newRunner('failSyncFails');
                await runAndDump(runner, nodeVersion);
                assert(runner.createdErrorIssue('Failed to sync workspace. Error: Simulated get failure'),
                    'expected tl.error issue describing get/sync failure');
                assert(runner.stdOutContained('[mock-tfvc] get '), 'should have attempted the get/sync step');
            });
        });
    });
});
