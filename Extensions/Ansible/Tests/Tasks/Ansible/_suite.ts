import assert = require('assert');
import childProcess = require('child_process');
import fs = require('fs');
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

const nodeVersions = getDeclaredNodeVersions().filter((v) => v >= 20);

describe('Ansible Suite', function () {
    this.timeout(120000);

    before(function () {
        ensureTaskMainJs();
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