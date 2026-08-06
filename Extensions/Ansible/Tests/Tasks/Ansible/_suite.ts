import assert = require('assert');
import childProcess = require('child_process');
import fs = require('fs');
import os = require('os');
import path = require('path');
import { TestGuid } from './mockAnsibleUtils';

const mocktest = require('azure-pipelines-task-lib/mock-test');

process.env['DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF'] = 'true';

const taskJsonPath = path.join(process.cwd(), 'Extensions', 'Ansible', 'Src', 'Tasks', 'Ansible', 'task.json');
const taskFolderPath = path.join(process.cwd(), '_build', 'Extensions', 'Ansible', 'Src', 'Tasks', 'Ansible');
const taskMainPath = path.join(taskFolderPath, 'main.js');

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

function expectSuccess(runner: any, message: string): void {
    if (!runner.succeeded) {
        fail(runner, message);
    }
}

function expectFailure(runner: any, message: string): void {
    if (!runner.failed) {
        fail(runner, message);
    }
}

function outputContains(runner: any, value: string): boolean {
    const stdout = runner.stdout || '';
    const stderr = runner.stderr || '';
    return stdout.indexOf(value) >= 0 || stderr.indexOf(value) >= 0;
}

function quoteShellArg(value: string): string {
    if (process.platform === 'win32') {
        return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }

    return "'" + value.replace(/'/g, "'\\''") + "'";
}

async function runRealAgentCommand(scriptContents: string, failOnStdErr: boolean = false): Promise<{ stdout: string; stderr: string; error?: any; }> {
    const ansibleUtils = require(path.join(taskFolderPath, 'ansibleUtils.js'));
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-agent-command-'));
    const scriptPath = path.join(tempDir, 'script.js');
    fs.writeFileSync(scriptPath, scriptContents, 'utf8');

    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    let stdout = '';
    let stderr = '';
    let error: any;

    (process.stdout as any).write = (chunk: any, encoding?: any, callback?: any): boolean => {
        stdout += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
        const writeCallback = typeof encoding === 'function' ? encoding : callback;
        if (writeCallback) {
            writeCallback();
        }
        return true;
    };

    (process.stderr as any).write = (chunk: any, encoding?: any, callback?: any): boolean => {
        stderr += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
        const writeCallback = typeof encoding === 'function' ? encoding : callback;
        if (writeCallback) {
            writeCallback();
        }
        return true;
    };

    try {
        await ansibleUtils.runCommandOnSameMachine(quoteShellArg(process.execPath) + ' ' + quoteShellArg(scriptPath), { failOnStdErr });
    } catch (err) {
        error = err;
    } finally {
        (process.stdout as any).write = originalStdoutWrite;
        (process.stderr as any).write = originalStderrWrite;
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    return { stdout, stderr, error };
}

async function runRealAgentCommandTerminatedBySignal(): Promise<void> {
    const ansibleUtils = require(path.join(taskFolderPath, 'ansibleUtils.js'));
    const taskLib = require(path.join(taskFolderPath, 'node_modules', 'azure-pipelines-task-lib', 'task.js'));
    const originalSpawn = childProcess.spawn;

    taskLib.setResourcePath(path.join(taskFolderPath, 'task.json'), true);

    (childProcess as any).spawn = function (): childProcess.ChildProcess {
        const child = originalSpawn(process.execPath, ['-e', 'setInterval(() => {}, 1000);']);
        child.on('spawn', () => child.kill('SIGTERM'));
        return child;
    };

    try {
        await ansibleUtils.runCommandOnSameMachine('mock signal command', { failOnStdErr: false });
    } finally {
        (childProcess as any).spawn = originalSpawn;
    }
}

function ensureTaskMainJs(): void {
    if (fs.existsSync(taskMainPath)) {
        return;
    }

    const tscCmd = 'node "' + path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc') +
        '" --project "' + path.join(taskFolderPath, 'tsconfig.json') + '" --noEmit false';
    const result = childProcess.spawnSync(tscCmd, {
        cwd: process.cwd(),
        shell: true,
        stdio: 'pipe',
        encoding: 'utf8'
    });

    if (result.status !== 0 || !fs.existsSync(taskMainPath)) {
        const stderr = result.stderr || '';
        const stdout = result.stdout || '';
        throw new Error('Failed to compile Ansible task JavaScript for tests.\nSTDOUT:\n' + stdout + '\nSTDERR:\n' + stderr);
    }
}

const nodeVersions = getDeclaredNodeVersions();

describe('Ansible Suite', function () {
    this.timeout(120000);

    it('discovers at least one declared Node handler', function () {
        assert(nodeVersions.length > 0, 'expected at least one Node handler in task.json execution block');
    });

    before(function () {
        ensureTaskMainJs();
    });

    it('streams real agent command stdout to normal task output', async function () {
        const result = await runRealAgentCommand("process.stdout.write('visible ansible output');");

        assert(!result.error, 'should not fail when stdout is written');
        assert(result.stdout.indexOf('visible ansible output') >= 0, 'should stream stdout to normal task output');
    });

    it('prints agent machine playbook output to normal task output', async function () {
        const playbookOutput = 'PLAY [localhost] ***\\nTASK [Gathering Facts] ***\\nok: [localhost]\\nPLAY RECAP ***************\\n';
        const result = await runRealAgentCommand("process.stdout.write(" + JSON.stringify(playbookOutput) + ");");

        assert(!result.error, 'should not fail when playbook output is written');
        assert(result.stdout.indexOf(playbookOutput) >= 0, 'should print playbook output to normal task output');
    });

    it('streams real agent command stderr to normal task output when failOnStdErr is false', async function () {
        const result = await runRealAgentCommand("process.stderr.write('visible ansible stderr');");

        assert(!result.error, 'should not fail when failOnStdErr is false');
        assert(result.stderr.indexOf('visible ansible stderr') >= 0, 'should stream stderr to normal task output');
    });

    it('fails real agent command after streaming stderr when failOnStdErr is true', async function () {
        const result = await runRealAgentCommand("process.stderr.write('stderr that should fail');", true);

        assert(result.error, 'should fail when failOnStdErr is true and stderr is written');
        assert(result.stderr.indexOf('stderr that should fail') >= 0, 'should stream stderr before failing');
    });

    it('streams real agent command output beyond the old exec buffer limit', async function () {
        this.timeout(60000);

        const outputSize = 21 * 1024 * 1024;
        const marker = 'large-output-complete';
        const result = await runRealAgentCommand("process.stdout.write('x'.repeat(" + outputSize + ")); process.stdout.write('" + marker + "');");

        assert(!result.error, 'should not fail when streaming large stdout');
        assert(result.stdout.length >= outputSize + marker.length, 'should capture output larger than the previous exec maxBuffer');
        assert(result.stdout.indexOf(marker) >= 0, 'should complete after streaming large stdout');
    });

    it('streams real agent command stderr beyond the old exec buffer limit', async function () {
        this.timeout(60000);

        const outputSize = 21 * 1024 * 1024;
        const marker = 'large-stderr-complete';
        const result = await runRealAgentCommand("process.stderr.write('e'.repeat(" + outputSize + ")); process.stderr.write('" + marker + "');");

        assert(!result.error, 'should not fail when failOnStdErr is false and large stderr is written');
        assert(result.stderr.length >= outputSize + marker.length, 'should capture stderr larger than the previous exec maxBuffer');
        assert(result.stderr.indexOf(marker) >= 0, 'should complete after streaming large stderr');
    });

    it('fails real agent command when spawned process is terminated by signal', async function () {
        let rejected = false;

        try {
            await runRealAgentCommandTerminatedBySignal();
        } catch (err) {
            rejected = true;
        }

        assert(rejected, 'should reject when the spawned process closes with a signal');
    });

    nodeVersions.forEach(function (nodeVersion) {
        describe('Node ' + nodeVersion, function () {
            it('runs remote playbook and inventory copied from agent machine', async function () {
                const runner = newRunner('testPlaybookAndInventoryOnAgentMachineForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected remote playbook copy scenario to succeed');
                assert(runner.stdOutContained('copied file to remote machine = /path/to/ansiblePlaybookRoot'), 'should copy playbook root');
                assert(runner.stdOutContained('copied file to remote machine = /path/to/ansibleInventory'), 'should copy inventory');
                assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i /tmp/ansibleInventory /tmp/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should execute playbook');
                assert(runner.stdOutContained('cmd run on remote machine = rm -rf /tmp/ansiblePlaybookRoot'), 'should clean up copied playbook root');
                assert(runner.stdOutContained('cmd run on remote machine = rm -f /tmp/ansibleInventory'), 'should clean up copied inventory');
                assert(runner.stdOutContained('connection to dummy client terminated'), 'should close the SSH client');
            });

            it('runs remote playbook and inventory already on ansible machine', async function () {
                const runner = newRunner('testPlaybookAndInventoryOnAnsibleMachineForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected ansible machine source scenario to succeed');
                assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i /path/to/ansibleInventory /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should execute playbook with provided paths');
            });

            it('runs remote host list inventory flow', async function () {
                const runner = newRunner('testInventoryToBeHostListForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected remote host list scenario to succeed');
                assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should append host list comma');
            });

            it('keeps remote host list comma when already present', async function () {
                const runner = newRunner('testInventoryHostListWithTrailingCommaForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected remote host list trailing comma scenario to succeed');
                assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should not add duplicate comma for remote host list');
            });

            it('runs remote inline dynamic inventory flow', async function () {
                const runner = newRunner('testInventoryToBeInlineForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected remote inline dynamic scenario to succeed');
                assert(runner.stdOutContained(`cmd run on remote machine = echo DUMMY_IP_ADDRESS > /tmp/${TestGuid}inventory.ini`), 'should create inline inventory');
                assert(runner.stdOutContained(`cmd run on remote machine = chmod +x /tmp/${TestGuid}inventory.ini`), 'should chmod dynamic inventory');
            });

            it('runs remote inline static inventory flow', async function () {
                const runner = newRunner('testInventoryInlineStaticForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected remote inline static scenario to succeed');
                assert(!runner.stdOutContained(`cmd run on remote machine = chmod +x /tmp/${TestGuid}inventory.ini`), 'should not chmod static inventory');
                assert(runner.stdOutContained(`cmd run on remote machine = rm -f /tmp/${TestGuid}inventory.ini`), 'should clean up temporary remote inventory');
            });

            it('runs remote sudo and additional args flow', async function () {
                const runner = newRunner('testSudoUserAndAdditionalParamsProvidedForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected remote sudo flow to succeed');
                assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -b --become-user root --extra-variables "pass=123"'), 'should execute with sudo and additional args');
            });

            it('runs remote flow with explicit sudo user', async function () {
                const runner = newRunner('testSudoUserProvidedForRemoteMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected explicit sudo user scenario to succeed');
                assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -b --become-user deployer'), 'should honor provided sudo user');
            });

            it('runs remote flow with default SSH port fallback', async function () {
                const runner = newRunner('testRemoteUsesDefaultPort');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected default SSH port scenario to succeed');
                assert(outputContains(runner, 'loc_mock_UseDefaultPort'), 'should print default port localization token');
            });

            it('runs remote flow with private key auth', async function () {
                const runner = newRunner('testRemoteUsesPrivateKeyAuth');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected private key auth scenario to succeed');
                assert(outputContains(runner, 'loc_mock_SettingUpSshConnection DummyUser true dummy host 22'), 'should setup ssh connection using endpoint data');
            });

            it('runs agent machine file inventory flow', async function () {
                const runner = newRunner('testPlaybookAndInventoryOnAgentMachineForAgentMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected agent file inventory scenario to succeed');
                assert(runner.stdOutContained('cmd run on agent machine = ansible-playbook -i /path/to/ansibleInventory ansiblePlaybook.yml'), 'should execute on agent machine');
            });

            it('runs agent machine host list flow', async function () {
                const runner = newRunner('testInventoryToBeHostListForAgentMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected agent host list scenario to succeed');
                assert(runner.stdOutContained('cmd run on agent machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should execute using host list');
            });

            it('keeps host list comma when already present', async function () {
                const runner = newRunner('testInventoryHostListWithTrailingCommaForAgentMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected host list trailing comma scenario to succeed');
                assert(runner.stdOutContained('cmd run on agent machine = ansible-playbook -i "Dummy_IP_Address," ansiblePlaybook.yml'), 'should not add duplicate comma');
            });

            it('runs agent machine inline inventory flow', async function () {
                const runner = newRunner('testInventoryToBeInlineForAgentMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected agent inline scenario to succeed');
                assert(runner.stdOutContained(`cmd run on agent machine = echo DUMMY_IP_ADDRESS > /tmp/${TestGuid}inventory.ini`), 'should write inline inventory on agent');
            });

            it('runs agent machine static inline inventory flow without chmod', async function () {
                const runner = newRunner('testInventoryInlineStaticForAgentMachine');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected agent static inline scenario to succeed');
                assert(!runner.stdOutContained(`cmd run on agent machine = chmod +x /tmp/${TestGuid}inventory.ini`), 'should not chmod static inventory on agent machine');
                assert(runner.stdOutContained(`cmd run on agent machine = rm -f /tmp/${TestGuid}inventory.ini`), 'should clean up temporary agent inventory');
            });

            it('fails on windows agent platform', async function () {
                const runner = newRunner('failAgentWindowsMachine');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected windows agent to fail');
                assert(outputContains(runner, 'loc_mock_AgentOnWindowsMachine'), 'should fail with windows-agent token');
            });

            it('fails when ansible binary is missing', async function () {
                const runner = newRunner('failAgentAnsibleNotInstalled');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected missing ansible to fail');
                assert(outputContains(runner, 'loc_mock_AnisbleNotPresent'), 'should fail when ansible is unavailable');
            });

            it('fails when agent command reports stderr with failOnStdErr', async function () {
                const runner = newRunner('failAgentCommandWhenFailOnStdErr');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected failOnStdErr on agent machine to fail');
                assert(outputContains(runner, 'mock stderr from agent command'), 'should surface mock agent stderr failure');
            });

            it('fails when playbook root is not a directory', async function () {
                const runner = newRunner('failRemotePlaybookRootNotDirectory');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected invalid playbook root to fail');
                assert(outputContains(runner, 'loc_mock_PlaybookRootNotDirectory'), 'should fail with directory validation token');
            });

            it('fails when playbook file is missing in root', async function () {
                const runner = newRunner('failRemotePlaybookMissingUnderRoot');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected missing playbook in root to fail');
                assert(outputContains(runner, 'loc_mock_PlaybookNotPresent'), 'should fail with playbook missing token');
            });

            it('fails when inventory file is missing on agent source', async function () {
                const runner = newRunner('failRemoteInventoryFileMissing');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected missing inventory file to fail');
                assert(outputContains(runner, 'loc_mock_InventoryFileNotPresent'), 'should fail with inventory missing token');
            });

            it('fails when ssh setup fails', async function () {
                const runner = newRunner('failRemoteSshConnection');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected ssh setup failure');
                assert(outputContains(runner, 'mock ssh connect failed'), 'should surface ssh setup failure reason');
            });

            it('fails when playbook copy fails', async function () {
                const runner = newRunner('failRemoteCopyPlaybook');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected remote copy failure');
                assert(outputContains(runner, 'mock scp failed'), 'should surface copy failure reason');
            });

            it('fails when remote command reports stderr with failOnStdErr', async function () {
                const runner = newRunner('failRemoteCommandWhenFailOnStdErr');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected remote failOnStdErr failure');
                assert(outputContains(runner, 'mock stderr from remote command'), 'should surface mock remote stderr failure');
            });

            it('fails when remote command execution rejects', async function () {
                const runner = newRunner('failRemoteCommandError');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected remote command rejection failure');
                assert(outputContains(runner, 'mock remote command failed'), 'should surface remote command rejection reason');
            });

            it('runs ansible tower success baseline', async function () {
                const runner = newRunner('testTower');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected tower baseline scenario to succeed');
                assert(runner.stdOutContained('Dummy stdout 1'), 'should output tower event 1');
                assert(runner.stdOutContained('Dummy stdout 2'), 'should output tower event 2');
                assert(runner.stdOutContained('Dummy stdout 3'), 'should output tower event 3');
            });

            it('runs ansible tower pagination scenario', async function () {
                const runner = newRunner('testTowerPagination');
                await runAndDump(runner, nodeVersion);
                expectSuccess(runner, 'expected tower pagination scenario to succeed');
                assert(runner.stdOutContained('Page1 stdout'), 'should output first page event');
                assert(runner.stdOutContained('Page2 stdout'), 'should output second page event');
            });

            it('fails when tower job template is not found', async function () {
                const runner = newRunner('failTowerTemplateNotFound');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected tower template-not-found to fail');
                assert(outputContains(runner, 'loc_mock_JobTemplateNotPresent'), 'should fail with template-not-found token');
            });

            it('fails when tower template lookup succeeds with no results', async function () {
                const runner = newRunner('failTowerTemplateEmptyResults');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected empty tower template lookup to fail');
                assert(outputContains(runner, 'loc_mock_JobTemplateNotPresent'), 'should fail cleanly when tower template search returns no matches');
            });

            it('fails when tower launch returns non-201', async function () {
                const runner = newRunner('failTowerLaunch');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected tower launch error to fail');
                assert(outputContains(runner, 'loc_mock_CouldnotLaunchJob'), 'should fail when launch API does not return 201');
            });

            it('fails when tower job status becomes failed', async function () {
                const runner = newRunner('testTowerFailedJob');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected tower failed-job status to fail task');
            });

            it('fails when tower job status api returns non-200', async function () {
                const runner = newRunner('failTowerJobStatusApi');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected tower job status API error to fail');
                assert(outputContains(runner, 'loc_mock_FailedToGetJobDetails'), 'should fail with job status fetch token');
            });

            it('fails when tower events api returns non-200', async function () {
                const runner = newRunner('failTowerEventsApi');
                await runAndDump(runner, nodeVersion);
                expectFailure(runner, 'expected tower events API error to fail');
                assert(outputContains(runner, 'loc_mock_FailedToGetJobDetails'), 'should fail with job details fetch token');
            });
        });
    });
});