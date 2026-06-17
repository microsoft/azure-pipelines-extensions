// Mocha suite for DownloadArtifactsTfsGit.
//
// Each scenario file is a `.ts` source under this directory; gulp `compileTests`
// transpiles them into `.js` under `_build/Extensions/.../Tests/Tasks/DownloadArtifactsTfsGit/`.
// MockTestRunner spawns a child Node process to run the compiled `.js`,
// which is why this driver references `<scenario>.js` paths.
//
// Scenarios are executed across every Node version declared in the task's
// `task.json` execution block. With master's task.json that's Node16 + Node20.
// When the support for new Node versions is introduced, this driver will
// pick them up automatically without code changes.

import assert = require('assert');
import path = require('path');
import fs = require('fs');

// MockTestRunner has no .d.ts in our compile path; use the value via require.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mocktest = require('azure-pipelines-task-lib/mock-test');

// CI parity: hosted agents set this variable so azure-pipelines-task-lib
// suppresses `tl.debug()` output unless `system.debug=true`. Mirror that
// behavior locally to prevent assertions that accidentally rely on debug
// emission from passing locally but failing on the build agent.
// Spawned child processes inherit this from us via cp.spawnSync.
process.env['DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF'] = 'true';

const taskJsonPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadArtifactsTfsGit', 'task.json');

function getDeclaredNodeVersions(): number[] {
    const taskJson = JSON.parse(fs.readFileSync(taskJsonPath, 'utf-8'));
    const versions = new Set<number>();
    const exec = taskJson.execution || {};
    for (const key of Object.keys(exec)) {
        const m = /^Node(\d*)/i.exec(key);
        if (!m) continue;
        const v = parseInt(m[1], 10) || 6; // bare "Node" handler == node 6
        versions.add(v);
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
        // mock-test rarely rejects, but surface any spawn-level failure clearly.
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

const nodeVersions = getDeclaredNodeVersions();

describe('DownloadArtifactsTfsGit Suite', function () {
    // Tests spawn child node processes; first run per version may download node.
    this.timeout(120000);

    nodeVersions.forEach(function (nodeVersion) {
        describe('Node ' + nodeVersion, function () {

            // ---- Success scenarios -----------------------------------------

            it('clones using reposOrTfs Token auth', async function () {
                const runner = newRunner('successReposOrTfsToken');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-webapi] getBasicHandler user=.'), 'should construct basic handler with username "." for Token scheme');
                assert(runner.stdOutContained('[mock-git] clone'), 'should invoke git clone');
                assert(runner.stdOutContained('[mock-git] checkout master'), 'should checkout branch');
                assert(runner.stdOutContained('[mock-git] checkout 1234567890abcdef1234567890abcdef12345678'), 'should checkout commit');
            });

            it('clones using reposOrTfs UsernamePassword auth', async function () {
                const runner = newRunner('successReposOrTfsUserPass');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-webapi] getBasicHandler user=tfs-user'), 'should construct basic handler with provided username');
                assert(runner.stdOutContained('[mock-git] clone'), 'should invoke git clone');
                // mock-task echoes the setsecret command but does not perform masking;
                // asserting the registration command was issued is the strongest contract
                // available in this test environment.
                assert(runner.stdOutContained('##vso[task.setsecret]tfs-password'), 'password must be registered as a secret via tl.setSecret');
            });

            it('reads auth parameters case-insensitively (uppercase keys)', async function () {
                const runner = newRunner('successAuthParamCaseInsensitive');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-webapi] getBasicHandler user=tfs-user'), 'should still resolve username when parameters are uppercased');
            });

            it('clones using ADO workload identity federation', async function () {
                const runner = newRunner('successAdoWif');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-auth] wif ado-connection-id'), 'should invoke WIF token exchange');
                assert(runner.stdOutContained('[mock-webapi] getBearerHandler'), 'should use bearer handler for ADO');
                assert(!runner.stdOutContained('[mock-webapi] getBasicHandler'), 'should not use basic handler for ADO');
                assert(runner.stdOutContained('[mock-git] clone'), 'should invoke git clone');
            });

            it('fetches and checks out commit for pull-request branches', async function () {
                const runner = newRunner('successPullRequest');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed. stdout:\n' + runner.stdout);
                assert(runner.stdOutContained('[mock-git] clone'), 'should invoke git clone');
                assert(runner.stdOutContained('[mock-git] fetch origin refs/pull/42/merge'), 'should fetch the PR ref');
                assert(runner.stdOutContained('[mock-git] checkout 1234567890abcdef1234567890abcdef12345678'), 'should checkout the commit (PR path)');
                // For PR path the script does NOT call `git checkout <branch>` separately.
                const checkoutBranch = runner.stdOutContained('[mock-git] checkout refs/pull/42/merge');
                assert(!checkoutBranch, 'PR path must not checkout the branch name; only the commit');
            });

            it('detects PR branches with refs/remotes/origin/pull/ prefix', async function () {
                const runner = newRunner('successPullRequestRemotePrefix');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                // The presence of a `git fetch origin <branch>` call (only issued on the PR
                // code path) proves isPullRequestBranch() returned true for this ref. We
                // deliberately do NOT assert on the `IsPullRequest:true` tl.debug line
                // because tl.debug emission is gated by the agent variable
                // `DistributedTask.Tasks.Node.SkipDebugLogsWhenDebugModeOff` and is
                // therefore environment-dependent (suppressed on hosted agents by default).
                assert(runner.stdOutContained('[mock-git] fetch origin refs/remotes/origin/pull/99/merge'), 'should fetch the PR ref via the alternate prefix');
            });

            it('retries clone on transient failure and ultimately succeeds', async function () {
                const runner = newRunner('successRetryOnTransientFailure');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed after retry');
                assert(runner.stdOutContained('[mock-git] clone-attempt 1'), 'should make first attempt');
                // The second clone attempt is the observable proof that executeWithRetries
                // re-invoked the operation. We do NOT assert on the `RetryingOperation:`
                // tl.debug line: tl.debug emission is gated by the agent variable
                // `DistributedTask.Tasks.Node.SkipDebugLogsWhenDebugModeOff` and is
                // therefore environment-dependent (suppressed on hosted agents by default).
                assert(runner.stdOutContained('[mock-git] clone-attempt 2'), 'should retry after first failure');
            });

            // ---- Failure / validation scenarios ----------------------------

            it('throws when service connection is empty', async function () {
                const runner = newRunner('failMissingServiceConnection');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing service connection');
                assert(runner.stdOutContained('Service connection is not provided'), 'expected validateInputs to throw for missing service connection');
            });

            it('throws when repository id is empty', async function () {
                const runner = newRunner('failMissingRepository');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing repository');
                assert(runner.stdOutContained('Repository is not provided'), 'expected validateInputs to throw for missing repository');
            });

            it('throws when project id is empty', async function () {
                const runner = newRunner('failMissingProject');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing project');
                assert(runner.stdOutContained('Project is not provided'), 'expected validateInputs to throw for missing project');
            });

            it('throws when branch is empty', async function () {
                const runner = newRunner('failMissingBranch');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing branch');
                assert(runner.stdOutContained('Branch is not provided'), 'expected validateInputs to throw for missing branch');
            });

            it('throws when commit id is empty', async function () {
                const runner = newRunner('failMissingCommitId');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing commit id');
                assert(runner.stdOutContained('Commit ID is not provided'), 'expected validateInputs to throw for missing commit id');
            });

            it('throws when download path is empty', async function () {
                const runner = newRunner('failMissingDownloadPath');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing download path');
                assert(runner.stdOutContained('Download path is not provided'), 'expected validateInputs to throw for missing download path');
            });

            it('fails when endpoint URL cannot be resolved', async function () {
                const runner = newRunner('failNoEndpointUrl');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when endpoint URL is missing');
                // tl.getEndpointUrl(name, false) throws "Endpoint not present" when the
                // endpoint env vars are absent; the task's `if (!hostUrl)` guard is a
                // defensive backstop that's unreachable in practice.
                assert(runner.stdOutContained('Endpoint not present'), 'expected "Endpoint not present" failure');
            });

            it('fails when endpoint authorization is missing (reposOrTfs)', async function () {
                const runner = newRunner('failNoEndpointAuthorization');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when endpoint authorization is missing');
                assert(runner.stdOutContained('Failed to get authorization details for service connection'), 'expected error mentioning missing authorization');
            });

            it('fails when authorization scheme is not Token/UsernamePassword', async function () {
                const runner = newRunner('failUnsupportedAuthScheme');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for unsupported scheme');
                assert(runner.stdOutContained('not supported for a External Tfs endpoint'), 'expected unsupported-scheme error');
            });

            it('fails when ADO service connection scheme is not WIF', async function () {
                const runner = newRunner('failAdoWrongAuthScheme');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for non-WIF ADO scheme');
                assert(runner.stdOutContained('is not supported'), 'expected scheme-not-supported error from auth.js');
            });

            it('fails when repository remoteUrl is missing', async function () {
                const runner = newRunner('failRepoMissingRemoteUrl');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when remoteUrl is missing');
                assert(runner.stdOutContained('Repository object missing remoteUrl'), 'expected missing-remoteUrl error');
            });

            it('fails when getRepository returns null', async function () {
                const runner = newRunner('failRepoLookupReturnsNull');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when getRepository returns null');
                assert(runner.stdOutContained('Repository lookup returned null or undefined'), 'expected null-repository error');
            });

            it('fails when ADO WIF returns no access token', async function () {
                const runner = newRunner('failAdoTokenMissing');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when WIF returns no token');
                assert(runner.stdOutContained('Password is not provided for the service connection'), 'expected missing-password error from getGitClientPromise');
            });

            it('fails when all git clone retries are exhausted', async function () {
                const runner = newRunner('failRetriesExhausted');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail after retries exhausted');
                // GIT_CLONE_RETRY_ATTEMPTS = 4 => 1 initial + 4 retries = 5 attempts.
                assert(runner.stdOutContained('[mock-git] clone-attempt 5'), 'should attempt clone the maximum number of times');
                assert(runner.stdOutContained('OperationFailed: gitClone'), 'should emit OperationFailed once retries are exhausted');
            });
        });
    });
});
