import assert = require('assert');
import path = require('path');

const mocktest = require('azure-pipelines-task-lib/mock-test');

process.env['DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF'] = 'true';

function newRunner(scenario: string): any {
    return new mocktest.MockTestRunner(path.join(__dirname, scenario + '.js'));
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

// TeamCity task.json declares only "Node" (legacy handler). All modern agents run
// Node 20+ per the repo engines requirement.
const NODE_VERSION = 20;

describe('DownloadTeamCityArtifacts Suite', function () {
    this.timeout(120000);

    // -- Success scenarios ------------------------------------------------------

    it('succeeds with basic auth and calls artifact-engine processItems', async function () {
        const runner = newRunner('successBasicAuthDownload');
        await runAndDump(runner, NODE_VERSION);
        if (!runner.succeeded) fail(runner, 'expected task to succeed');

        assert(runner.stdOutContained('[mock-basic-handler] ctor user=tc-user passSet=true'),
            'should build BasicCredentialHandler with username and password from endpoint');
        assert(runner.stdOutContained('[mock-web-provider] ctor url=https://teamcity.example.com/httpAuth/app/rest/builds/id:42/artifacts/children/'),
            'should construct the correct TeamCity artifact-listing URL');
        assert(runner.stdOutContained('[mock-fs-provider] ctor path=artifacts'),
            'should target the requested downloadPath');
        assert(runner.stdOutContained('[mock-artifact-engine] processItems'),
            'should invoke ArtifactEngine.processItems');
    });

    it('masks password with tl.setSecret before any HTTP call', async function () {
        const runner = newRunner('successPasswordMasked');
        await runAndDump(runner, NODE_VERSION);
        if (!runner.succeeded) fail(runner, 'expected task to succeed');

        assert(runner.stdOutContained('##vso[task.setsecret]tc-pass'),
            'should register the endpoint password as a secret via tl.setSecret');
    });

    it('uses default itemPattern ** when input is not provided', async function () {
        const runner = newRunner('successItemPatternDefault');
        await runAndDump(runner, NODE_VERSION);
        if (!runner.succeeded) fail(runner, 'expected task to succeed');

        assert(runner.stdOutContained('[mock-artifact-engine] processItems itemPattern=**'),
            'should default itemPattern to ** when caller does not supply one');
    });

    it('passes custom itemPattern through unchanged', async function () {
        const runner = newRunner('successItemPatternCustom');
        await runAndDump(runner, NODE_VERSION);
        if (!runner.succeeded) fail(runner, 'expected task to succeed');

        assert(runner.stdOutContained('[mock-artifact-engine] processItems itemPattern=**/*.zip'),
            'should honor a caller-supplied itemPattern');
    });

    it('honors release.artifact.download.parallellimit variable', async function () {
        const runner = newRunner('successParallelLimit');
        await runAndDump(runner, NODE_VERSION);
        if (!runner.succeeded) fail(runner, 'expected task to succeed');

        assert(runner.stdOutContained('[mock-artifact-engine] processItems parallelLimit=8'),
            'should propagate the parallellimit variable into downloaderOptions');
    });

    // -- Failure scenarios ------------------------------------------------------

    it('fails when TeamCity returns 404 build-not-found', async function () {
        const runner = newRunner('fail404BuildNotFound');
        await runAndDump(runner, NODE_VERSION);
        if (runner.succeeded) fail(runner, 'expected task to fail with 404');

        assert(runner.stdOutContained('[mock-artifact-engine] processItems'),
            'should invoke processItems before failing');
        assert(runner.stdOutContained('##vso[task.issue type=error'),
            'should surface the backend error via tl.error / task.issue');
        assert(runner.stdOutContained('##vso[task.complete result=Failed'),
            'should mark the task Failed (not crash or complete Succeeded)');
        assert(runner.stdOutContained('404 - Build not found'),
            'should propagate the actual 404 error message from artifact-engine, not a different failure path');
    });

    it('fails when TeamCity returns 401 auth error', async function () {
        const runner = newRunner('fail401AuthFailure');
        await runAndDump(runner, NODE_VERSION);
        if (runner.succeeded) fail(runner, 'expected task to fail with 401');

        assert(runner.stdOutContained('[mock-artifact-engine] processItems'),
            'should invoke processItems before failing');
        assert(runner.stdOutContained('##vso[task.issue type=error'),
            'should surface the backend error via tl.error / task.issue');
        assert(runner.stdOutContained('##vso[task.complete result=Failed'),
            'should mark the task Failed (not crash or complete Succeeded)');
        assert(runner.stdOutContained('401 - Unauthorized'),
            'should propagate the actual 401 error message from artifact-engine, not a different failure path');
    });

    it('fails when required "connection" input is missing', async function () {
        const runner = newRunner('failMissingConnection');
        await runAndDump(runner, NODE_VERSION);
        if (runner.succeeded) fail(runner, 'expected task to fail when connection input is missing');
    });

    it('fails when required "version" input is missing', async function () {
        const runner = newRunner('failMissingVersion');
        await runAndDump(runner, NODE_VERSION);
        if (runner.succeeded) fail(runner, 'expected task to fail when version input is missing');
    });

    it('fails when required "downloadPath" input is missing', async function () {
        const runner = newRunner('failMissingDownloadPath');
        await runAndDump(runner, NODE_VERSION);
        if (runner.succeeded) fail(runner, 'expected task to fail when downloadPath input is missing');
    });
});
