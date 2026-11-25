// Mocha suite for DownloadExternalBuildArtifacts.
//
// Each scenario file is a `.ts` source under this directory; gulp `compileTests`
// transpiles them into `.js` under `_build/Extensions/.../Tests/Tasks/DownloadExternalBuildArtifacts/`.
// MockTestRunner spawns a child Node process to run the compiled `.js`,
// which is why this driver references `<scenario>.js` paths.
//
// Scenarios are executed across every Node version declared in the task's
// `task.json` execution block.
// When new handlers are added, this driver picks them up automatically.

import assert = require('assert');
import fs = require('fs');
import path = require('path');

import { MockTestRunner } from 'azure-pipelines-task-lib/mock-test';

// CI parity: hosted agents set this variable so azure-pipelines-task-lib
// suppresses `tl.debug()` output unless `system.debug=true`. Mirror that
// behavior locally to prevent assertions that accidentally rely on debug
// emission from passing locally but failing on the build agent.
// Spawned child processes inherit this from us via cp.spawnSync.
process.env['DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF'] = 'true';

const taskJsonPath = path.join(__dirname, '..', '..', '..', 'Src', 'Tasks', 'DownloadExternalBuildArtifacts', 'task.json');

function getDeclaredNodeVersions(): number[] {
    const taskJson = JSON.parse(fs.readFileSync(taskJsonPath, 'utf-8'));
    const versions = new Set<number>();
    const exec = taskJson.execution || {};
    for (const key of Object.keys(exec)) {
        const m = /^Node(\d*)/i.exec(key);
        if (!m) continue;
        const v = parseInt(m[1], 10) || 6;
        versions.add(v);
    }
    return Array.from(versions).sort((a, b) => a - b);
}

function newRunner(scenario: string): MockTestRunner {
    const testPath = path.join(__dirname, scenario + '.js');
    return new MockTestRunner(testPath, taskJsonPath);
}

async function runAndDump(runner: MockTestRunner, nodeVersion: number): Promise<void> {
    try {
        await runner.runAsync(nodeVersion);
    } catch (err) {
        console.log('--- runner threw ---');
        console.log(err);
        throw err;
    }
}

function fail(runner: MockTestRunner, msg: string): never {
    console.log('--- STDOUT ---');
    console.log(runner.stdout);
    console.log('--- STDERR ---');
    console.log(runner.stderr);
    throw new Error(msg);
}

const nodeVersions = getDeclaredNodeVersions();

describe('DownloadExternalBuildArtifacts Suite', function () {
    this.timeout(120000);

    nodeVersions.forEach(function (nodeVersion) {
        describe('Node ' + nodeVersion, function () {

            // ---- Success scenarios -----------------------------------------

            it('downloads container artifacts for reposOrTfs (Token auth)', async function () {
                const runner = newRunner('successReposOrTfsContainer');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-buildapi] getArtifacts'), 'should fetch the artifact list from the build API');
                assert(runner.stdOutContained('[mock-providers] WebProvider'), 'container artifacts must use WebProvider');
                assert(runner.stdOutContained('/_apis/resources/Containers/123?itemPath=drop'), 'WebProvider URL must include container id and path');
                assert(runner.stdOutContained('[mock-providers] FilesystemProvider /tmp/external-build-artifacts'), 'destination FilesystemProvider should use the configured downloadPath');
                assert(runner.stdOutContained('[mock-engine] processItems'), 'should invoke ArtifactEngine.processItems');
                // mock-task's tl.loc() emits "loc_mock_<KEY> <args>" rather than resolving against task.json.
                assert(runner.stdOutContained('loc_mock_ArtifactsSuccessfullyDownloaded /tmp/external-build-artifacts'), 'should log final success message');
            });

            it('downloads filepath artifacts for reposOrTfs', async function () {
                const runner = newRunner('successReposOrTfsFilePath');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                // For filepath artifacts the task uses FilesystemProvider for both source and dest.
                assert(runner.stdOutContained('[mock-providers] FilesystemProvider'), 'filepath artifact must use FilesystemProvider as source');
                assert(!runner.stdOutContained('[mock-providers] WebProvider'), 'filepath artifact must NOT use WebProvider');
                assert(runner.stdOutContained('[mock-engine] processItems'), 'should invoke ArtifactEngine.processItems');
            });

            const filepathCases = [undefined, 'false', 'true'].flatMap(featureValue =>
                [false, true].map(pathExists => ({ featureValue, pathExists })));
            for (const { featureValue, pathExists } of filepathCases) {
                it(`respects the extension VSO flag for ${pathExists ? 'existing' : 'missing'} filepath artifacts when ${featureValue ?? 'unset'}`, async function () {
                    const feature = 'DISTRIBUTEDTASK_TASKS_ENABLEVSOCOMMANDBLOCKINGEXTENSIONS';
                    const previousValue = process.env[feature];
                    const pathExistsVariable = 'EXTERNAL_TFS_TEST_ARTIFACT_PATH_EXISTS';
                    const previousPathExists = process.env[pathExistsVariable];
                    process.env[pathExistsVariable] = String(pathExists);
                    if (featureValue === undefined) {
                        Reflect.deleteProperty(process.env, feature);
                    } else {
                        process.env[feature] = featureValue;
                    }

                    try {
                        const runner = newRunner('successFilePathExternalOutput');
                        await runAndDump(runner, nodeVersion);
                        if (!runner.succeeded) fail(runner, 'expected task to succeed');

                        const blocked = featureValue === 'true';
                        const marker = blocked ? '##_vso[' : '##vso[';
                        const downloadUrl = `/some/share/${marker}task.setvariable variable=PATH_TEST]data-sentinel`;
                        const artifactName = `${marker}task.setvariable variable=NAME_TEST]name-sentinel`;
                        if (pathExists) {
                            assert(!runner.stdout.includes('loc_mock_ArtifactNameDirectoryNotFound'));
                            assert(runner.stdout.includes(`loc_mock_DownloadArtifacts ${downloadUrl}/${artifactName}`));
                        } else {
                            assert(runner.stdout.includes(`loc_mock_ArtifactNameDirectoryNotFound ${downloadUrl}/${artifactName} ${downloadUrl}`));
                            assert(runner.stdout.includes(`loc_mock_DownloadArtifacts ${downloadUrl}`));
                        }

                        const telemetryLines = runner.stdout.split('\n').filter(line =>
                            line.startsWith('##vso[telemetry.publish area=TaskLib;feature=ExternalOutputVsoCommand;]')
                        );
                        assert.strictEqual(telemetryLines.length, pathExists ? 2 : 4);
                        for (const line of telemetryLines) {
                            const event = JSON.parse(line.slice(line.indexOf(']') + 1));
                            assert.strictEqual(event.source, 'remote');
                            assert.strictEqual(event.commandName, 'task.setvariable');
                            assert.strictEqual(event.blocked, blocked);
                            assert(!line.includes('data-sentinel'));
                            assert(!line.includes('name-sentinel'));
                        }
                    } finally {
                        if (previousValue === undefined) {
                            Reflect.deleteProperty(process.env, feature);
                        } else {
                            process.env[feature] = previousValue;
                        }
                        if (previousPathExists === undefined) {
                            Reflect.deleteProperty(process.env, pathExistsVariable);
                        } else {
                            process.env[pathExistsVariable] = previousPathExists;
                        }
                    }
                });
            }

            it('downloads artifacts via ADO workload identity federation', async function () {
                const runner = newRunner('successAdoWif');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-auth] wif ado-connection-id'), 'should invoke WIF token exchange');
                // ADO path returns empty username -> task should use PAT handler.
                assert(runner.stdOutContained('[mock-handlers] PersonalAccessTokenCredentialHandler'), 'ADO path with empty username should use PAT handler');
                assert(!runner.stdOutContained('[mock-handlers] BasicCredentialHandler'), 'ADO path with empty username should NOT use Basic handler');
                assert(runner.stdOutContained('[mock-buildapi] getArtifacts'), 'should fetch artifacts from build API');
            });

            it('honors itemPattern input on the downloader options', async function () {
                const runner = newRunner('successItemPatternHonored');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-engine] processItems pattern=drop/**'), 'itemPattern input should propagate to ArtifactEngineOptions');
            });

            it('skips artifacts with unsupported type', async function () {
                const runner = newRunner('successUnsupportedArtifactType');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed even when artifacts are skipped');
                assert(runner.stdOutContained('Unsupported artifact type: symbolStore') || runner.stdOutContained('UnsupportedArtifactType'),
                    'should log unsupported artifact type warning');
                assert(!runner.stdOutContained('[mock-providers] WebProvider'), 'unsupported artifact must not create WebProvider');
                assert(!runner.stdOutContained('[mock-providers] FilesystemProvider'), 'unsupported artifact must not create FilesystemProvider');
            });

            for (const featureValue of [undefined, 'false', 'true']) {
                it(`respects the extension VSO flag for artifact diagnostics when ${featureValue ?? 'unset'}`, async function () {
                    const feature = 'DISTRIBUTEDTASK_TASKS_ENABLEVSOCOMMANDBLOCKINGEXTENSIONS';
                    const previousValue = process.env[feature];
                    if (featureValue === undefined) {
                        Reflect.deleteProperty(process.env, feature);
                    } else {
                        process.env[feature] = featureValue;
                    }

                    try {
                        const runner = newRunner('successExternalOutput');
                        await runAndDump(runner, nodeVersion);
                        assert(runner.succeeded, 'expected task to succeed');

                        const command = '##vso[task.setvariable variable=OUTPUT_TEST]external-data-sentinel';
                        const blocked = featureValue === 'true';
                        const expected = blocked ? command.replace('##vso[', '##_vso[') : command;
                        assert(runner.stdout.includes('unsupported\r' + expected));

                        const telemetryLines = runner.stdout.split('\n').filter(line =>
                            line.startsWith('##vso[telemetry.publish area=TaskLib;feature=ExternalOutputVsoCommand;]')
                        );
                        assert.strictEqual(telemetryLines.length, 1);
                        const event = JSON.parse(telemetryLines[0].slice(telemetryLines[0].indexOf(']') + 1));
                        assert.strictEqual(event.source, 'remote');
                        assert.strictEqual(event.commandName, 'task.setvariable');
                        assert.strictEqual(event.blocked, blocked);
                        assert(!telemetryLines[0].includes('OUTPUT_TEST'));
                        assert(!telemetryLines[0].includes('external-data-sentinel'));
                    } finally {
                        if (previousValue === undefined) {
                            Reflect.deleteProperty(process.env, feature);
                        } else {
                            process.env[feature] = previousValue;
                        }
                    }
                });
            }

            for (const featureValue of [undefined, 'false', 'true']) {
                it(`respects the extension VSO flag for destination paths when ${featureValue ?? 'unset'}`, async function () {
                    const feature = 'DISTRIBUTEDTASK_TASKS_ENABLEVSOCOMMANDBLOCKINGEXTENSIONS';
                    const previousValue = process.env[feature];
                    if (featureValue === undefined) {
                        Reflect.deleteProperty(process.env, feature);
                    } else {
                        process.env[feature] = featureValue;
                    }

                    try {
                        const runner = newRunner('successDestinationPathOutput');
                        await runAndDump(runner, nodeVersion);
                        assert(runner.succeeded, 'expected task to succeed');

                        const command = '##vso[task.setvariable variable=OUTPUT_TEST]destination-path-sentinel';
                        const blocked = featureValue === 'true';
                        const expected = blocked ? command.replace('##vso[', '##_vso[') : command;
                        assert(runner.stdout.includes(`loc_mock_ArtifactsSuccessfullyDownloaded /tmp/external-build-artifacts\r\n${expected}`));
                        if (blocked) {
                            assert(!runner.stdout.includes(command));
                        }

                        const telemetryLines = runner.stdout.split('\n').filter(line =>
                            line.startsWith('##vso[telemetry.publish area=TaskLib;feature=ExternalOutputVsoCommand;]')
                        );
                        assert.strictEqual(telemetryLines.length, 1);
                        const event = JSON.parse(telemetryLines[0].slice(telemetryLines[0].indexOf(']') + 1));
                        assert.strictEqual(event.source, 'repository');
                        assert.strictEqual(event.commandName, 'task.setvariable');
                        assert.strictEqual(event.blocked, blocked);
                        assert(!telemetryLines[0].includes('destination-path-sentinel'));

                        const engineRunner = newRunner('successReposOrTfsContainer');
                        await runAndDump(engineRunner, nodeVersion);
                        assert(engineRunner.succeeded, 'expected artifact download to succeed');
                        const engineMode = blocked ? 'blockAndTelemetry' : 'blockOnly';
                        assert(engineRunner.stdout.includes(`vsoCommandMode=${engineMode}`));
                    } finally {
                        if (previousValue === undefined) {
                            Reflect.deleteProperty(process.env, feature);
                        } else {
                            process.env[feature] = previousValue;
                        }
                    }
                });
            }

            it('retries getArtifacts on transient failure and ultimately succeeds', async function () {
                const runner = newRunner('successGetArtifactsRetry');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed after retry');
                assert(runner.stdOutContained('[mock-buildapi] getArtifacts-attempt 1'), 'should make first attempt');
                assert(runner.stdOutContained('[mock-buildapi] getArtifacts-attempt 2'), 'should retry after first failure');
                assert(runner.stdOutContained('loc_mock_RetryingOperation getArtifacts'), 'should emit RetryingOperation message');
                assert(runner.stdOutContained('[mock-engine] processItems'), 'should download artifacts after successful retry');
            });

            it('uses BasicCredentialHandler for container download when UsernamePassword scheme provides a username', async function () {
                const runner = newRunner('successUserPassUsesBasicHandler');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');
                assert(runner.stdOutContained('[mock-handlers] BasicCredentialHandler user=tfs-user'), 'UsernamePassword scheme should use BasicCredentialHandler with the provided username');
                assert(!runner.stdOutContained('[mock-handlers] PersonalAccessTokenCredentialHandler'), 'UsernamePassword scheme must NOT fall through to the PAT handler');
            });

            // ---- Failure / validation scenarios ----------------------------

            it('fails when reposOrTfs service connection is missing', async function () {
                const runner = newRunner('failMissingTfsConnection');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing connection');
                assert(runner.stdOutContained('Input required: connection') || runner.stdOutContained('Service connection is not provided'),
                    'expected error indicating missing service connection');
            });

            it('fails when project input is missing', async function () {
                const runner = newRunner('failMissingProject');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing project');
                assert(runner.stdOutContained('Input required: project') || runner.stdOutContained('Project is not provided'),
                    'expected error indicating missing project');
            });

            it('fails when build (version) input is missing', async function () {
                const runner = newRunner('failMissingBuild');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing build');
                assert(runner.stdOutContained('Input required: version') || runner.stdOutContained('Build is not provided'),
                    'expected error indicating missing build');
            });

            it('fails when container artifact data is malformed', async function () {
                const runner = newRunner('failContainerInvalidArtifactData');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for malformed container data');
                assert(runner.stdOutContained('FileContainerInvalidArtifactData') || runner.stdOutContained('Invalid file container artifact'),
                    'expected error about malformed container artifact data');
            });

            it('fails when ArtifactEngine.processItems rejects', async function () {
                const runner = newRunner('failDownloadProcessFails');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when processItems rejects');
                assert(runner.stdOutContained('Simulated download failure'), 'expected the rejection reason to surface in the task error');
            });
        });
    });
});
