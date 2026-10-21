import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Readable, Writable } from 'stream';

import type { VsoCommandMode } from 'azure-pipelines-task-lib/externaloutput';
import * as taskLibInternal from 'azure-pipelines-task-lib/internal';
import * as tl from 'azure-pipelines-task-lib/task';
// eslint-disable-next-line import/no-extraneous-dependencies -- EngineTests is a test directory.
import * as sinon from 'sinon';

import { ArtifactEngine, ArtifactEngineOptions } from '../Engine';
import * as ci from '../Engine/cilogger';
import { Logger } from '../Engine/logger';
import { Worker } from '../Engine/worker';
import { ArtifactItem, ItemType } from '../Models';
import { TicketState } from '../Models/ticketState';
import { FilesystemProvider } from '../Providers/filesystemProvider';
import { StubProvider } from '../Providers/stubProvider';
import { WebProvider } from '../Providers/webProvider';
import { ArtifactItemStore } from '../Store/artifactItemStore';

const featureVariable = 'DISTRIBUTEDTASK_TASKS_ENABLEARTIFACTENGINEEXTERNALOUTPUT';
const marker = '##vso[task.setvariable variable=ARTIFACT_ENGINE_TEST]value';
const modes: VsoCommandMode[] = ['disabled', 'telemetryOnly', 'blockOnly', 'blockAndTelemetry'];
const initialMode = Logger.vsoCommandMode;
const methods = [
    { external: 'infoExternalOutput', legacy: 'logInfo', helper: 'debugExternalOutput' },
    { external: 'errorExternalOutput', legacy: 'logError', helper: 'errorExternalOutput' },
    { external: 'messageExternalOutput', legacy: 'logMessage', helper: 'writeExternalOutput' }
] as const;

describe('external logger tests', () => {
    let sandbox: ReturnType<typeof sinon.createSandbox>;
    let output: string[];
    let originalFeature: string | undefined;
    let originalMode: VsoCommandMode;
    let originalVerbose: boolean;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalFeature = process.env[featureVariable];
        originalMode = Logger.vsoCommandMode;
        originalVerbose = Logger.verbose;
        Logger.vsoCommandMode = 'blockOnly';
        Logger.verbose = false;
        process.env[featureVariable] = 'true';
        output = [];
        sandbox.stub(process.stdout, 'write').callsFake((chunk: string | Buffer) => {
            output.push(chunk.toString());
            return true;
        });
        tl.setResourcePath(path.join(__dirname, '..', 'lib.json'));
    });

    afterEach(() => {
        sandbox.restore();
        restoreEnvironment(featureVariable, originalFeature);
        Logger.vsoCommandMode = originalMode;
        Logger.verbose = originalVerbose;
    });

    for (const method of methods) {
        it(`${method.legacy} preserves legacy behavior independently of the new feature and mode`, () => {
            Logger.vsoCommandMode = 'disabled';
            const feature = sandbox.spy(tl, 'getPipelineFeature');
            const helper = sandbox.spy(tl, method.helper);
            const debug = sandbox.spy(tl, 'debug');

            Logger[method.legacy](marker);

            assert.strictEqual(feature.callCount, 0);
            if (method.legacy === 'logMessage') {
                assert.strictEqual(helper.callCount, 1);
                assert.deepStrictEqual(helper.firstCall.args, [marker + os.EOL, { source: 'remote' }]);
                assert.ok(!output.join('').includes(marker));
                assert.ok(output.includes(marker.replace('##vso[', '##_vso[') + os.EOL));
            } else {
                assert.strictEqual(helper.callCount, 0);
                if (method.legacy === 'logInfo') {
                    assert.ok(debug.calledWith(marker));
                } else {
                    assert.ok(output.join('').includes(marker));
                }
            }
        });

        for (const flag of [undefined, 'false']) {
            it(`${method.external} delegates to the original logger when the feature is ${flag}`, () => {
                restoreEnvironment(featureVariable, flag);
                Logger.vsoCommandMode = 'disabled';
                const legacy = sandbox.spy(Logger, method.legacy);
                const helper = sandbox.spy(tl, method.helper);
                const debug = sandbox.spy(tl, 'debug');

                Logger[method.external](marker);

                assert.strictEqual(legacy.callCount, 1);
                assert.strictEqual(legacy.firstCall.args[0], marker);
                if (method.external === 'messageExternalOutput') {
                    assert.strictEqual(helper.callCount, 1);
                    assert.deepStrictEqual(helper.firstCall.args, [marker + os.EOL, { source: 'remote' }]);
                    assert.ok(!output.join('').includes(marker));
                    assert.ok(output.join('').includes('##_vso[task.setvariable'));
                } else {
                    assert.strictEqual(helper.callCount, 0);
                    if (method.external === 'infoExternalOutput') {
                        assert.ok(debug.calledWith(marker));
                    } else {
                        assert.ok(output.join('').includes(marker));
                    }
                }
                assert.ok(!output.join('').includes('##vso[telemetry.publish'));
            });
        }

        for (const mode of modes) {
            it(`${method.external} passes ${mode} to the matching real output helper`, () => {
                Logger.vsoCommandMode = mode;
                const feature = sandbox.spy(tl, 'getPipelineFeature');
                const helper = sandbox.spy(tl, method.helper);
                const legacy = sandbox.spy(Logger, method.legacy);
                const debug = sandbox.spy(taskLibInternal, '_debug');
                const text = `prefix ${marker}\r\nsecond ${marker}`;

                Logger[method.external](text);

                assert.strictEqual(helper.callCount, 1);
                assert.deepStrictEqual(feature.firstCall.args, ['EnableArtifactEngineExternalOutput']);
                assert.deepStrictEqual(helper.firstCall.args, [
                    method.external === 'messageExternalOutput' ? text + os.EOL : text,
                    { source: 'remote', vsoCommandMode: mode }
                ]);
                assert.strictEqual(legacy.callCount, 0);
                const blocked = mode === 'blockOnly' || mode === 'blockAndTelemetry';
                const logged = output.join('');
                if (method.external === 'infoExternalOutput') {
                    assert.ok(debug.calledWith(blocked ? text.replace(/##vso\[/g, '##_vso[') : text));
                } else {
                    assert.strictEqual(logged.includes(marker), !blocked);
                    assert.strictEqual(logged.includes('##_vso[task.setvariable'), blocked);
                }
                assert.strictEqual(
                    logged.includes('##vso[telemetry.publish'),
                    mode === 'telemetryOnly' || mode === 'blockAndTelemetry');
                if (method.external === 'errorExternalOutput') {
                    assert.ok(logged.includes('##vso[task.issue type=error;'));
                }
            });
        }

        it(`${method.external} does not fall back to legacy output when filtering fails`, () => {
            sandbox.stub(tl, method.helper).throws(new Error('filter failed'));
            const legacy = sandbox.spy(Logger, method.legacy);

            assert.throws(() => Logger[method.external](marker), /filter failed/);
            assert.strictEqual(legacy.callCount, 0);
        });
    }

    it('messageExternalOutput preserves ordinary text and exactly one native newline', () => {
        Logger.messageExternalOutput('ordinary text');
        Logger.messageExternalOutput('');
        Logger.messageExternalOutput('already terminated' + os.EOL);

        assert.ok(output.includes('ordinary text' + os.EOL));
        assert.ok(output.includes(os.EOL));
        assert.ok(output.includes('already terminated' + os.EOL + os.EOL));
    });

    it('messageExternalOutput blocks an incomplete command marker', () => {
        Logger.messageExternalOutput('prefix ##vso[');

        assert.ok(output.includes('prefix ##_vso[' + os.EOL));
    });

    it('infoExternalOutput preserves the task-lib debug framing for ordinary text', () => {
        const debug = sandbox.spy(taskLibInternal, '_debug');
        output.length = 0;
        tl.debug('ordinary text\r\nsecond');
        const legacy = output.join('');
        output.length = 0;

        Logger.infoExternalOutput('ordinary text\r\nsecond');

        assert.ok(debug.calledWith('ordinary text\r\nsecond'));
        assert.ok(output.join('').endsWith(legacy));
    });

    it('defaults Logger and new options to blockOnly', () => {
        assert.strictEqual(initialMode, 'blockOnly');
        assert.strictEqual(new ArtifactEngineOptions().vsoCommandMode, 'blockOnly');
    });

    it('sets each caller mode before provider output and resets omitted options', async () => {
        sandbox.stub(ci, 'publishEvent');
        const provider = new StubProvider();
        const expectedModes: VsoCommandMode[] = [...modes, 'blockOnly', 'blockOnly'];
        let rootCalls = 0;
        sandbox.stub(provider, 'getRootItems').callsFake(() => {
            assert.strictEqual(Logger.vsoCommandMode, expectedModes[rootCalls++]);
            Logger.messageExternalOutput(marker);
            return Promise.resolve([]);
        });

        for (const mode of modes) {
            const options = new ArtifactEngineOptions();
            options.vsoCommandMode = mode;
            await new ArtifactEngine().processItems(provider, provider, options);
        }
        await new ArtifactEngine().processItems(provider, provider);
        const oldOptions: ArtifactEngineOptions = {
            retryLimit: 5,
            retryIntervalInSeconds: 5,
            fileProcessingTimeoutInMinutes: 5,
            parallelProcessingLimit: 4,
            itemPattern: '**',
            verbose: false
        };
        Logger.vsoCommandMode = 'disabled';
        await new ArtifactEngine().processItems(provider, provider, oldOptions);
        assert.strictEqual(rootCalls, expectedModes.length);
    });

    it('filters only the external summary row and preserves internal formatting', () => {
        const store = new ArtifactItemStore();
        const item = new ArtifactItem();
        item.path = `drop/${marker}\r\nsecond`;
        item.itemType = ItemType.File;
        store.addItem(item);
        const ticket = store.getTickets()[0];
        ticket.state = TicketState.Processed;
        ticket.startTime = new Date('2026-01-01T00:00:00Z');
        ticket.finishTime = new Date('2026-01-01T00:00:01Z');
        const external = sandbox.spy(Logger, 'infoExternalOutput');
        const debug = sandbox.spy(taskLibInternal, '_debug');
        const internal = sandbox.spy(tl, 'debug');
        const telemetry = sandbox.stub(ci, 'publishEvent');
        Logger.verbose = true;

        new Logger(store).logSummary();

        assert.strictEqual(external.callCount, 1);
        assert.ok(external.firstCall.args[0].includes(item.path));
        assert.strictEqual(item.path, `drop/${marker}\r\nsecond`);
        assert.ok(!output.join('').includes(marker));
        assert.ok(debug.calledWithMatch('##_vso[task.setvariable'));
        assert.ok(internal.calledWith('Summary:'));
        assert.strictEqual(telemetry.callCount, 1);
        assert.strictEqual(telemetry.firstCall.args[0], 'performance');
    });

    it('filters real filesystem-provider logs without changing paths or downloaded bytes', async () => {
        const bytes: Buffer[] = [];
        const destination = new Writable({
            write(chunk, encoding, callback) {
                bytes.push(Buffer.from(chunk));
                callback();
            }
        });
        const writeStream = sandbox.stub(fs, 'createWriteStream').returns(destination);
        sandbox.stub(tl, 'mkdirP');
        const provider = new FilesystemProvider(path.resolve('drop'));
        provider.artifactItemStore = new ArtifactItemStore();
        const item = new ArtifactItem();
        item.path = `nested/${marker}.txt`;
        item.itemType = ItemType.File;
        const source = new Readable({
            read() {
                this.push('unchanged file content');
                this.push(null);
            }
        });
        const external = sandbox.spy(Logger, 'messageExternalOutput');

        const result = await provider.putArtifactItem(item, source);

        assert.strictEqual(result, item);
        assert.strictEqual(item.path, `nested/${marker}.txt`);
        assert.strictEqual(writeStream.firstCall.args[0], path.resolve('drop', item.path));
        assert.strictEqual(item.metadata['destinationUrl'], path.resolve('drop', item.path));
        assert.strictEqual(Buffer.concat(bytes).toString(), 'unchanged file content');
        assert.strictEqual(external.callCount, 2);
        assert.ok(!output.join('').includes(marker));
        assert.ok(output.join('').includes('##_vso[task.setvariable'));
    });

    it('filters a malformed remote response while preserving its parse failure', async () => {
        const body = `not JSON ${marker}`;
        sandbox.stub(fs, 'readFile').callsFake((filename, encoding, callback) => callback(null, '[]'));
        const provider = new WebProvider('https://unused.invalid', 'template.handlebars', {}, null);
        sandbox.stub(provider.webClient, 'get').resolves({
            readBody: () => Promise.resolve(body)
        });
        const external = sandbox.spy(Logger, 'messageExternalOutput');

        try {
            const roots = await provider.getRootItems();
            await assert.rejects(provider.getArtifactItems(roots[0]), SyntaxError);
        } finally {
            provider.dispose();
        }

        assert.strictEqual(external.callCount, 1);
        assert.ok(external.firstCall.args[0].includes(body));
        assert.ok(!output.join('').includes(marker));
        assert.ok(output.join('').includes('##_vso[task.setvariable'));
    });

    it('filters retry and provider-error messages and preserves the original rejection', async () => {
        const provider = new StubProvider();
        const item = provider.getItem(1, 1, 0, ItemType.File);
        item.path = `drop/${marker}.txt`;
        const failure = new Error(`provider error ${marker}`);
        sandbox.stub(provider, 'getRootItems').resolves([item]);
        sandbox.stub(provider, 'getArtifactItem').rejects(failure);
        sandbox.stub(ci, 'publishEvent');
        const message = sandbox.spy(Logger, 'messageExternalOutput');
        const info = sandbox.spy(Logger, 'infoExternalOutput');
        const options = new ArtifactEngineOptions();
        options.parallelProcessingLimit = 1;
        options.retryLimit = 2;
        options.retryIntervalInSeconds = 0;

        await assert.rejects(
            new ArtifactEngine().processItems(provider, provider, options),
            error => error === failure);

        assert.ok(message.calledOnce);
        assert.ok(message.firstCall.args[0].includes(item.path));
        assert.ok(info.args.some(args => args[0].includes(failure.message)));
        assert.ok(!output.join('').includes(marker));
    });

    it('filters skipped paths without trying to download the skipped item', async () => {
        const provider = new StubProvider();
        const item = provider.getItem(1, 1, 0, ItemType.File);
        item.path = `drop/${marker}.txt`;
        sandbox.stub(provider, 'getRootItems').resolves([item]);
        const download = sandbox.spy(provider, 'getArtifactItem');
        sandbox.stub(ci, 'publishEvent');
        const message = sandbox.spy(Logger, 'messageExternalOutput');
        const options = new ArtifactEngineOptions();
        options.parallelProcessingLimit = 1;
        options.itemPattern = 'unmatched';

        const tickets = await new ArtifactEngine().processItems(provider, provider, options);

        assert.strictEqual(download.callCount, 0);
        assert.strictEqual(tickets[0].state, TicketState.Skipped);
        assert.ok(message.calledOnce);
        assert.ok(message.firstCall.args[0].includes(item.path));
        assert.ok(!output.join('').includes(marker));
    });

    it('leaves internal progress counters unfiltered', () => {
        const clock = sandbox.useFakeTimers();
        const external = sandbox.spy(Logger, 'infoExternalOutput');
        const debug = sandbox.spy(tl, 'debug');
        Logger.verbose = true;

        new Logger(new ArtifactItemStore()).logProgress();
        clock.tick(5000);

        assert.strictEqual(external.callCount, 0);
        assert.ok(debug.calledWithMatch('Total Items: 0, Processed: 0'));
    });

    it('keeps worker status and enqueue counts on the trusted internal API', async () => {
        const internal = sandbox.spy(Logger, 'logInfo');
        const external = sandbox.spy(Logger, 'infoExternalOutput');
        const worker = new Worker<ArtifactItem>(
            3, () => Promise.resolve(), () => undefined, () => true, () => false);
        await worker.init();
        const provider = new StubProvider();
        const folder = provider.getItem(1, 1, 0, ItemType.Folder);
        sandbox.stub(provider, 'getArtifactItems').resolves([]);

        await new ArtifactEngine().processArtifactItem(
            provider, folder, provider, new ArtifactEngineOptions());

        assert.ok(internal.calledWith('Nothing more to process, exiting worker 3.'));
        assert.ok(internal.calledWith('Enqueued 0 for processing.'));
        assert.strictEqual(external.callCount, 0);
    });

    it('does not log verbose rows or schedule progress when verbose is false', () => {
        const clock = sandbox.useFakeTimers();
        const external = sandbox.spy(Logger, 'infoExternalOutput');
        sandbox.stub(ci, 'publishEvent');
        const logger = new Logger(new ArtifactItemStore());

        logger.logProgress();
        logger.logSummary();
        clock.tick(5000);

        assert.strictEqual(external.callCount, 0);
        assert.ok(!output.join('').includes('Summary:'));
        assert.ok(!output.join('').includes('Total Items:'));
    });

    for (const agentVersion of ['3.0.0', '2.119.0']) {
        it(`preserves intentional telemetry command framing on agent ${agentVersion}`, () => {
            const originalVersion = process.env.AGENT_VERSION;
            process.env.AGENT_VERSION = agentVersion;
            Logger.vsoCommandMode = 'blockAndTelemetry';
            const helper = sandbox.spy(tl, 'writeExternalOutput');
            output.length = 0;
            try {
                ci.publishEvent('reliability', {
                    issueType: 'error',
                    errorMessage: JSON.stringify({ message: `${marker}\r\nsecond` }),
                    stack: ''
                });
            } finally {
                restoreEnvironment('AGENT_VERSION', originalVersion);
            }

            const lines = output.join('').trim().split(/\r?\n/).filter(line => !line.startsWith('##vso[task.debug]'));
            assert.strictEqual(lines.length, 1);
            if (agentVersion === '3.0.0') {
                assert.ok(lines[0].startsWith('##vso[telemetry.publish area=artifact-engine-v2;feature=reliability]'));
            } else {
                assert.ok(lines[0].startsWith('##vso[task.logissue '));
                assert.ok(lines[0].includes('taskId=artifact-engine-v2-'));
            }
            assert.ok(lines[0].includes('\\r\\n') || lines[0].includes('\\\\r\\\\n'));
            assert.strictEqual(helper.callCount, 0);
        });
    }
});

function restoreEnvironment(name: string, value: string | undefined): void {
    if (value === undefined) {
        Reflect.deleteProperty(process.env, name);
    } else {
        process.env[name] = value;
    }
}
