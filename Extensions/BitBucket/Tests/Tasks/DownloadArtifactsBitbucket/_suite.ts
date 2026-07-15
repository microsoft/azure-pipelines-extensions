import assert = require('assert');
import fs = require('fs');
import path = require('path');

const mocktest = require('azure-pipelines-task-lib/mock-test');

process.env['DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF'] = 'true';

const taskJsonPath = path.join(process.cwd(), 'Extensions', 'BitBucket', 'Src', 'Tasks', 'DownloadArtifactsBitbucket', 'task.json');
const sourceControlWrapperModulePath = path.join(process.cwd(), 'Extensions', 'BitBucket', 'Src', 'Tasks', 'DownloadArtifactsBitbucket', 'sourcecontrolwrapper.js');
const sourceControlWrapperTl = (function (): any {
    try {
        const resolvedPath = (require as any).resolve('azure-pipelines-task-lib/task', { paths: [path.dirname(sourceControlWrapperModulePath)] });
        return require(resolvedPath);
    } catch (err) {
        return require('azure-pipelines-task-lib/task');
    }
})();

function getDeclaredNodeVersions(): number[] {
    const taskJson = JSON.parse(fs.readFileSync(taskJsonPath, 'utf-8'));
    const versions = new Set<number>();
    const exec = taskJson.execution || {};

    for (const key of Object.keys(exec)) {
        const match = /^Node(\d*)/i.exec(key);
        if (!match) {
            continue;
        }

        versions.add(parseInt(match[1], 10) || 6);
    }

    return Array.from(versions).sort((a, b) => a - b);
}

function newRunner(scenario: string): any {
    return new mocktest.MockTestRunner(path.join(__dirname, scenario + '.js'), taskJsonPath);
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

const nodeVersions = getDeclaredNodeVersions();

describe('DownloadArtifactsBitbucket Suite', function () {
    this.timeout(120000);

    nodeVersions.forEach(function (nodeVersion) {
        describe('Node ' + nodeVersion, function () {

            it('succeeds with token auth and performs clone + checkout sequence', async function () {
                const runner = newRunner('successTokenAuth');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');

                assert(runner.stdOutContained('[mock-https] request /2.0/repositories/workspace/repo authUser=token-user@example.com'), 'should call Bitbucket API with token username');
                assert(runner.stdOutContained('[mock-scw] ctor tool=git'), 'should initialize source control wrapper with scm from API');
                assert(runner.stdOutContained('[mock-scw] clone https://***@bitbucket.org/org/repo.git .'), 'should clone with authenticated URL');
                assert(runner.stdOutContained('[mock-scw] auth user=x-bitbucket-api-token-auth passSet=true'), 'should set API token auth username/password on wrapper');
                assert(runner.stdOutContained('[mock-scw] checkout refs/remotes/origin/main'), 'should checkout normalized branch ref');
                assert(runner.stdOutContained('[mock-scw] checkout 1234567890abcdef1234567890abcdef12345678'), 'should checkout commit');
                assert(runner.stdOutContained('##vso[task.setsecret]bb-token'), 'should register token as secret');
            });

            it('succeeds with username/password auth path', async function () {
                const runner = newRunner('successUserPassAuth');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');

                assert(runner.stdOutContained('[mock-https] request /2.0/repositories/workspace/repo authUser=bb-user'), 'should call Bitbucket API with username auth');
                assert(runner.stdOutContained('[mock-scw] clone https://***@bitbucket.org/org/repo.git .'), 'should clone with authenticated URL');
                assert(runner.stdOutContained('[mock-scw] auth user=bb-user passSet=true'), 'should set username/password on wrapper');
                assert(runner.stdOutContained('[mock-scw] checkout develop'), 'should checkout raw branch when not refs/heads/*');
                assert(runner.stdOutContained('##vso[task.setsecret]bb-pass'), 'should register password as secret');
            });

            it('succeeds when API reports hg scm and forwards tool type to wrapper', async function () {
                const runner = newRunner('successHgScm');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed for hg repository metadata');

                assert(runner.stdOutContained('[mock-scw] ctor tool=hg'), 'should create wrapper with scm from API response');
                assert(runner.stdOutContained('[mock-scw] clone https://***@bitbucket.org/org/repo.git .'), 'should still clone repository');
            });

            it('succeeds when token auth email parameter is omitted', async function () {
                const runner = newRunner('successTokenAuthNoEmail');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed when token email parameter is missing');
                assert(runner.stdOutContained('[mock-https] request /2.0/repositories/workspace/repo authUser='), 'should call Bitbucket API with empty auth username when email is missing');
                assert(runner.stdOutContained('[mock-scw] auth user=x-bitbucket-api-token-auth passSet=true'), 'should still use token auth username for clone credentials');
            });

            it('supports case-insensitive token auth parameter names', async function () {
                const runner = newRunner('successAuthParamCaseInsensitiveToken');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed with uppercase token auth parameter keys');

                assert(runner.stdOutContained('[mock-https] request /2.0/repositories/workspace/repo authUser=token-user@example.com'), 'should read uppercase token parameters');
            });

            it('supports case-insensitive username/password parameter names', async function () {
                const runner = newRunner('successAuthParamCaseInsensitiveUserPass');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed with uppercase username/password keys');

                assert(runner.stdOutContained('[mock-https] request /2.0/repositories/workspace/repo authUser=bb-user'), 'should read uppercase username/password parameters');
            });

            it('normalizes refs/heads/* to refs/remotes/origin/* for checkout', async function () {
                const runner = newRunner('successBranchNormalization');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');

                assert(runner.stdOutContained('[mock-scw] checkout refs/remotes/origin/release/v1'), 'should convert branch ref for checkout');
            });

            it('recursively removes existing download path before clone', async function () {
                const runner = newRunner('successCleanupRecursive');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to succeed');

                assert(runner.stdOutContained('[mock-fs] unlink a.txt'), 'should remove top-level files');
                assert(runner.stdOutContained('[mock-fs] unlink sub/b.txt'), 'should remove nested files');
                assert(runner.stdOutContained('[mock-fs] rmdir sub'), 'should remove nested directories');
                assert(runner.stdOutContained('[mock-fs] rmdir .'), 'should remove target directory');
            });

            it('fails when required input connection is missing', async function () {
                const runner = newRunner('failMissingConnection');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing connection');

                assert(runner.stdOutContained('Input required: connection'), 'should fail on missing connection input');
            });

            it('fails when required input definition is missing', async function () {
                const runner = newRunner('failMissingDefinition');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing definition');

                assert(runner.stdOutContained('Input required: definition'), 'should fail on missing definition input');
            });

            it('fails when required input branch is missing', async function () {
                const runner = newRunner('failMissingBranch');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing branch');

                assert(runner.stdOutContained('Input required: branch'), 'should fail on missing branch input');
            });

            it('fails when required input version is missing', async function () {
                const runner = newRunner('failMissingVersion');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing version');

                assert(runner.stdOutContained('Input required: version'), 'should fail on missing version input');
            });

            it('fails when required input downloadPath is missing', async function () {
                const runner = newRunner('failMissingDownloadPath');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for missing downloadPath');

                assert(runner.stdOutContained('Input required: downloadPath'), 'should fail on missing downloadPath input');
            });

            it('fails for unsupported endpoint authorization scheme', async function () {
                const runner = newRunner('failUnsupportedAuthScheme');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for unsupported auth scheme');

                assert(runner.stdOutContained('is not supported for a bitbucket endpoint'), 'should reject unsupported auth scheme');
            });

            it('fails when endpoint authorization is missing', async function () {
                const runner = newRunner('failNoEndpointAuthorization');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when endpoint authorization is missing');

                const hasAuthError = runner.stdOutContained('scheme') || runner.stdOutContained('undefined') || runner.stdOutContained('Cannot read property');
                assert(hasAuthError, 'should report a missing endpoint authorization failure');
            });

            it('fails when token auth parameter is missing', async function () {
                const runner = newRunner('failMissingAuthParameter');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when apitoken parameter is absent');

                assert(runner.stdOutContained('does not have an API token parameter'), 'should surface missing API token failure');
                assert(!runner.stdOutContained('[mock-https] request'), 'should not call the API when token is missing');
            });

            it('fails when required password auth parameter is missing', async function () {
                const runner = newRunner('failMissingPasswordParameter');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when password parameter is absent');

                assert(runner.stdOutContained('does not have the required username and password parameters'), 'should surface missing username/password failure');
                assert(!runner.stdOutContained('[mock-https] request'), 'should not call the API when password is missing');
            });

            it('fails when required username parameter is missing', async function () {
                const runner = newRunner('failMissingUsernameParameter');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when username parameter is absent');

                assert(runner.stdOutContained('does not have the required username and password parameters'), 'should surface missing username/password failure');
                assert(!runner.stdOutContained('[mock-https] request'), 'should not call the API when username is missing');
            });

            it('fails when endpoint auth object is present but has no scheme', async function () {
                const runner = newRunner('failAuthMissingScheme');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when endpoint auth scheme is missing');

                const hasAuthError = runner.stdOutContained('scheme') || runner.stdOutContained('undefined') || runner.stdOutContained('Cannot read property');
                assert(hasAuthError, 'should report a missing auth scheme failure');
            });

            it('fails when Bitbucket API returns malformed json', async function () {
                const runner = newRunner('failMalformedApiResponse');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for malformed API response');

                const hasJsonError = runner.stdOutContained('Unexpected token') || runner.stdOutContained('JSON');
                assert(hasJsonError, 'should surface JSON parse failure');
            });

            it('fails when Bitbucket API payload misses links.clone', async function () {
                const runner = newRunner('failApiMissingCloneLinks');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when links.clone is missing');

                const hasShapeError = runner.stdOutContained('clone') || runner.stdOutContained('Cannot read') || runner.stdOutContained('undefined');
                assert(hasShapeError, 'should surface payload shape error for missing clone links');
            });

            it('continues when Bitbucket API payload misses scm', async function () {
                const runner = newRunner('failApiMissingScm');
                await runAndDump(runner, nodeVersion);
                if (!runner.succeeded) fail(runner, 'expected task to continue when scm is missing');

                assert(runner.stdOutContained('[mock-scw] ctor tool=undefined'), 'should pass an undefined scm through to the wrapper');
            });

            it('fails when Bitbucket API clone entry has no href', async function () {
                const runner = newRunner('failApiCloneHrefMissing');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail when clone href is missing');

                const hasShapeError = runner.stdOutContained('href') || runner.stdOutContained('undefined') || runner.stdOutContained('Cannot read');
                assert(hasShapeError, 'should surface a payload shape error for missing clone href');
            });

            it('fails when Bitbucket API payload has empty clone links array', async function () {
                const runner = newRunner('failApiEmptyCloneLinks');
                await runAndDump(runner, nodeVersion);
                if (runner.succeeded) fail(runner, 'expected task to fail for empty clone links array');

                const hasShapeError = runner.stdOutContained('clone') || runner.stdOutContained('href') || runner.stdOutContained('Cannot read');
                assert(hasShapeError, 'should surface payload shape error for empty clone links');
            });

            it('fails when recursive cleanup throws before any network operation', async function () {
                const runner = newRunner('failCleanupThrows');
                await runAndDump(runner, nodeVersion);
                const hasErrorSignal = !runner.succeeded || runner.stdOutContained('##vso[task.issue type=error;source=TaskInternal;]');
                if (!hasErrorSignal) fail(runner, 'expected cleanup error to emit a task error signal');

                assert(runner.stdOutContained('Simulated cleanup failure'), 'should surface recursive cleanup error');
                assert(!runner.stdOutContained('[mock-https] request'), 'should not call API when cleanup fails early');
            });

            it('fails when clone rejects', async function () {
                const runner = newRunner('failCloneFails');
                await runAndDump(runner, nodeVersion);
                const hasErrorSignal = !runner.succeeded || runner.stdOutContained('##vso[task.issue type=error;source=TaskInternal;]');
                if (!hasErrorSignal) fail(runner, 'expected task to emit an error signal when clone rejects');
                assert(runner.stdOutContained('Simulated clone failure'), 'should surface clone failure reason');
            });

            it('fails when checkout rejects', async function () {
                const runner = newRunner('failCheckoutFails');
                await runAndDump(runner, nodeVersion);
                const hasErrorSignal = !runner.succeeded || runner.stdOutContained('##vso[task.issue type=error;source=TaskInternal;]');
                if (!hasErrorSignal) fail(runner, 'expected task to emit an error signal when checkout rejects');
                assert(runner.stdOutContained('Simulated checkout failure'), 'should surface checkout failure reason');
            });
        });
    });
});

describe('SourceControlWrapper Unit Suite', function () {
    function newWrapper(): any {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const moduleRef = require(sourceControlWrapperModulePath);
        return new moduleRef.SourceControlWrapper('git');
    }

    it('builds expected args for clone/fetch/checkout/reset', async function () {
        const wrapper = newWrapper();
        const observed: Array<{ args: string[]; opts: any }> = [];

        wrapper.exec = function (args: string[], opts: any): Promise<number> {
            observed.push({ args, opts });
            return Promise.resolve(0);
        };

        await wrapper.clone('https://bitbucket.org/org/repo.git', true, 'repo', { debugOutput: true });
        await wrapper.fetch(['origin', 'refs/heads/main'], {});
        await wrapper.checkout('main', {});
        await wrapper.reset(['--hard', 'HEAD'], {});

        assert.strictEqual(JSON.stringify(observed[0].args), JSON.stringify(['clone', 'https://bitbucket.org/org/repo.git', '--progress', 'repo']));
        assert.strictEqual(JSON.stringify(observed[1].args), JSON.stringify(['fetch', 'origin', 'refs/heads/main']));
        assert.strictEqual(JSON.stringify(observed[2].args), JSON.stringify(['checkout', 'main']));
        assert.strictEqual(JSON.stringify(observed[3].args), JSON.stringify(['reset', '--hard', 'HEAD']));
        assert.strictEqual(observed[0].opts.creds, true, 'clone should force creds=true');
        assert.strictEqual(observed[1].opts.creds, true, 'fetch should force creds=true');
        assert.strictEqual(observed[2].opts.creds, true, 'checkout should force creds=true');
        assert.strictEqual(observed[3].opts.creds, undefined, 'reset should not force creds=true');
    });

    it('exec wires tool events and masks credentials in debug output', async function () {
        const originalWhich = sourceControlWrapperTl.which;
        const originalTool = sourceControlWrapperTl.tool;
        const originalSetSecret = sourceControlWrapperTl.setSecret;
        const originalWarning = sourceControlWrapperTl.warning;

        const seenArgs: string[] = [];
        let seenExecOps: any = null;
        const handlers: { [k: string]: Function } = {};
        const masked: string[] = [];

        sourceControlWrapperTl.which = function (): string {
            return '/usr/bin/git';
        };
        sourceControlWrapperTl.setSecret = function (value: string): void {
            masked.push(value);
        };
        sourceControlWrapperTl.warning = function (): void { return; };
        sourceControlWrapperTl.tool = function (): any {
            return {
                on: function (name: string, cb: Function): void { handlers[name] = cb; },
                arg: function (value: string): void { seenArgs.push(value); },
                execAsync: function (ops: any): Promise<number> {
                    seenExecOps = ops;
                    handlers.debug('run https://u:p@bitbucket.org/org/repo.git and u%3Ap');
                    handlers.stdout(new Buffer('stdout-line'));
                    handlers.stderr(new Buffer('stderr-line'));
                    return Promise.resolve(0);
                }
            };
        };

        try {
            const wrapper = newWrapper();
            wrapper.username = 'u';
            wrapper.password = 'p';

            const stdoutEvents: string[] = [];
            const stderrEvents: string[] = [];
            wrapper.on('stdout', function (data: any) { stdoutEvents.push(String(data)); });
            wrapper.on('stderr', function (data: any) { stderrEvents.push(String(data)); });

            const rc = await wrapper.exec(['clone', 'repo'], { debugOutput: true });

            assert.strictEqual(rc, 0, 'exec should resolve with tool return code');
            assert.strictEqual(JSON.stringify(seenArgs), JSON.stringify(['clone', 'repo']));
            assert.ok(stdoutEvents.some(x => x.indexOf('[debug]') === 0), 'should emit debug output');
            assert.ok(stdoutEvents.some(x => x.indexOf('...') >= 0), 'debug output should be masked');
            assert.ok(stdoutEvents.some(x => x.indexOf('stdout-line') >= 0), 'should forward stdout events');
            assert.ok(stderrEvents.some(x => x.indexOf('stderr-line') >= 0), 'should forward stderr events');
            assert.ok(masked.indexOf('p') >= 0, 'should mask raw password');
            assert.ok(masked.indexOf('u:p') >= 0 || masked.indexOf('u%3Ap') >= 0, 'should mask escaped credentials');
            assert.ok(seenExecOps && seenExecOps.cwd, 'exec should pass options to tool');
        } finally {
            sourceControlWrapperTl.which = originalWhich;
            sourceControlWrapperTl.tool = originalTool;
            sourceControlWrapperTl.setSecret = originalSetSecret;
            sourceControlWrapperTl.warning = originalWarning;
        }
    });

    it('throws when source control binary is not found', function () {
        const originalWhich = sourceControlWrapperTl.which;

        sourceControlWrapperTl.which = function (): never {
            throw new Error('not found');
        };

        try {
            const wrapper = newWrapper();
            assert.throws(function () {
                wrapper.exec(['status'], {});
            }, /not found/);
        } finally {
            sourceControlWrapperTl.which = originalWhich;
        }
    });

    it('does not emit debug output when debugOutput is false', async function () {
        const originalWhich = sourceControlWrapperTl.which;
        const originalTool = sourceControlWrapperTl.tool;

        const handlers: { [k: string]: Function } = {};

        sourceControlWrapperTl.which = function (): string {
            return '/usr/bin/git';
        };
        sourceControlWrapperTl.tool = function (): any {
            return {
                on: function (name: string, cb: Function): void { handlers[name] = cb; },
                arg: function (): void { return; },
                execAsync: function (): Promise<number> {
                    handlers.debug('contains-userpass u:p and u%3Ap');
                    return Promise.resolve(0);
                }
            };
        };

        try {
            const wrapper = newWrapper();
            wrapper.username = 'u';
            wrapper.password = 'p';

            const stdoutEvents: string[] = [];
            wrapper.on('stdout', function (data: any) { stdoutEvents.push(String(data)); });

            await wrapper.exec(['status'], { debugOutput: false });
            assert.strictEqual(stdoutEvents.length, 0, 'no debug output should be emitted when debugOutput=false');
        } finally {
            sourceControlWrapperTl.which = originalWhich;
            sourceControlWrapperTl.tool = originalTool;
        }
    });

    it('passes custom exec options through to tool runner', async function () {
        const originalWhich = sourceControlWrapperTl.which;
        const originalTool = sourceControlWrapperTl.tool;

        let capturedOps: any = null;

        sourceControlWrapperTl.which = function (): string {
            return '/usr/bin/git';
        };
        sourceControlWrapperTl.tool = function (): any {
            return {
                on: function (): void { return; },
                arg: function (): void { return; },
                execAsync: function (ops: any): Promise<number> {
                    capturedOps = ops;
                    return Promise.resolve(0);
                }
            };
        };

        try {
            const wrapper = newWrapper();
            const fakeOut = { write: function (): void { return; } } as any;
            const fakeErr = { write: function (): void { return; } } as any;
            const fakeEnv = { A: 'B' } as any;

            await wrapper.exec(['status'], {
                cwd: '/tmp/repo',
                env: fakeEnv,
                outStream: fakeOut,
                errStream: fakeErr
            });

            assert.strictEqual(capturedOps.cwd, '/tmp/repo');
            assert.strictEqual(capturedOps.env, fakeEnv);
            assert.strictEqual(capturedOps.outStream, fakeOut);
            assert.strictEqual(capturedOps.errStream, fakeErr);
        } finally {
            sourceControlWrapperTl.which = originalWhich;
            sourceControlWrapperTl.tool = originalTool;
        }
    });

    it('continues when setSecret throws and emits warning', async function () {
        const originalWhich = sourceControlWrapperTl.which;
        const originalTool = sourceControlWrapperTl.tool;
        const originalSetSecret = sourceControlWrapperTl.setSecret;
        const originalWarning = sourceControlWrapperTl.warning;

        let warningCount = 0;

        sourceControlWrapperTl.which = function (): string {
            return '/usr/bin/git';
        };
        sourceControlWrapperTl.setSecret = function (): never {
            throw new Error('secret store failure');
        };
        sourceControlWrapperTl.warning = function (message: string): void {
            warningCount++;
            assert(message.indexOf('Failed to mask credentials for log redaction') >= 0, 'should emit redaction warning');
        };
        sourceControlWrapperTl.tool = function (): any {
            return {
                on: function (): void { return; },
                arg: function (): void { return; },
                execAsync: function (): Promise<number> { return Promise.resolve(0); }
            };
        };

        try {
            const wrapper = newWrapper();
            wrapper.username = 'u';
            wrapper.password = 'p';
            const rc = await wrapper.exec(['status'], {});
            assert.strictEqual(rc, 0, 'exec should still succeed when secret masking fails');
            assert.strictEqual(warningCount, 1, 'should emit one warning when setSecret throws');
        } finally {
            sourceControlWrapperTl.which = originalWhich;
            sourceControlWrapperTl.tool = originalTool;
            sourceControlWrapperTl.setSecret = originalSetSecret;
            sourceControlWrapperTl.warning = originalWarning;
        }
    });

    it('propagates tool execution rejection', async function () {
        const originalWhich = sourceControlWrapperTl.which;
        const originalTool = sourceControlWrapperTl.tool;

        sourceControlWrapperTl.which = function (): string {
            return '/usr/bin/git';
        };
        sourceControlWrapperTl.tool = function (): any {
            return {
                on: function (): void { return; },
                arg: function (): void { return; },
                execAsync: function (): Promise<number> {
                    return Promise.reject(new Error('simulated exec failure'));
                }
            };
        };

        try {
            const wrapper = newWrapper();
            await wrapper.exec(['status'], {}).then(function () {
                throw new Error('expected rejection from wrapper.exec');
            }, function (err: Error) {
                assert(err.message.indexOf('simulated exec failure') >= 0, 'should propagate underlying exec error');
            });
        } finally {
            sourceControlWrapperTl.which = originalWhich;
            sourceControlWrapperTl.tool = originalTool;
        }
    });
});
