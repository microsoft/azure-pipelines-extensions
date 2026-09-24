import * as assert from 'assert';
import * as childProcess from 'child_process';

describe('Unit Tests', () => {
    describe('runtime compatibility', () => {
        it('loads ArtifactEngine without crypto.randomUUID', () => {
            const result = childProcess.spawnSync(process.execPath, [
                '-e',
                'delete require("crypto").randomUUID; require(process.argv[1]);',
                require.resolve('../Engine')
            ], {
                encoding: 'utf8',
                env: { ...process.env, INPUT_ARTIFACT_COMPATIBILITY: 'value' }
            });

            assert.ifError(result.error);
            assert.strictEqual(result.status, 0, result.stdout + result.stderr);
        });
    });
});
