// Direct unit tests for the standalone neutralizeAdditionalParameters function
// (extracted from ansibleCommandLineInterface). Unlike the scenario suite in
// _suite.ts, this exercises the pure function in isolation against a broad set
// of safe and malicious inputs. It loads the compiled module from _build,
// matching what the task resolves at runtime.
import assert = require('assert');
import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');

process.env['DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF'] = 'true';

const taskFolderPath = path.join(process.cwd(), '_build', 'Extensions', 'Ansible', 'Src', 'Tasks', 'Ansible');
const moduleJsPath = path.join(taskFolderPath, 'argsSanitization.js');

function ensureTaskJsCompiled(): void {
    if (fs.existsSync(moduleJsPath)) {
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

    if (result.status !== 0 || !fs.existsSync(moduleJsPath)) {
        throw new Error('Failed to compile argsSanitization.js for tests.\nSTDOUT:\n' +
            (result.stdout || '') + '\nSTDERR:\n' + (result.stderr || ''));
    }
}

function loadNeutralize(): (value: string) => string {
    return require(moduleJsPath).neutralizeAdditionalParameters;
}

describe('neutralizeAdditionalParameters', function () {
    let neutralize: (value: string) => string;

    before(function () {
        ensureTaskJsCompiled();
        neutralize = loadNeutralize();
    });

    describe('preserves safe inputs unchanged (flag-on must equal legacy)', function () {
        // Each of these must round-trip identically: enabling the hardening must
        // not change a legitimate argument, or it would break real pipelines.
        const safeInputs: { name: string; value: string }[] = [
            { name: 'empty string', value: '' },
            { name: 'plain flags', value: '--check --diff' },
            { name: 'JSON --extra-vars in single quotes', value: '--extra-vars \'{"a":"b"}\'' },
            { name: 'JSON --extra-vars with spaces', value: '--extra-vars \'{"msg":"hello world"}\'' },
            { name: 'unquoted $VAR reference', value: '-e app_dir=$HOME/app' },
            { name: 'unquoted ${VAR} reference', value: '-e app_dir=${HOME}/app' },
            { name: 'double-quoted value with spaces', value: '--tags "one two"' },
            { name: 'double-quoted $VAR (no substitution)', value: '-e "path=$HOME/bin"' },
            { name: 'glob in a limit pattern', value: '--limit web*' },
            { name: 'at-file reference', value: '-e @vars.yml' },
            { name: 'fully single-quoted metacharacters', value: '\'; whoami\'' },
            { name: 'already-escaped semicolon', value: 'a\\;b' },
        ];

        safeInputs.forEach(function (c) {
            it('keeps ' + c.name + ' unchanged', function () {
                assert.strictEqual(neutralize(c.value), c.value);
            });
        });
    });

    describe('neutralizes injection sequences outside quotes', function () {
        const cases: { name: string; input: string; expected: string }[] = [
            { name: 'command separator ;', input: '; whoami', expected: '\\; whoami' },
            { name: 'logical AND &&', input: 'a && b', expected: 'a \\&\\& b' },
            { name: 'pipe |', input: 'a | b', expected: 'a \\| b' },
            { name: 'background &', input: 'a & b', expected: 'a \\& b' },
            { name: 'command substitution $()', input: '-DFOO=$(whoami)', expected: '-DFOO=\\$\\(whoami\\)' },
            { name: 'backtick substitution', input: '-DFOO=`id`', expected: '-DFOO=\\`id\\`' },
            { name: 'output redirection >', input: 'x > /etc/passwd', expected: 'x \\> /etc/passwd' },
            { name: 'input redirection <', input: 'x < in.txt', expected: 'x \\< in.txt' },
            { name: 'subshell parentheses', input: '(subshell)', expected: '\\(subshell\\)' },
            { name: 'comment hash', input: 'a # comment', expected: 'a \\# comment' },
        ];

        cases.forEach(function (c) {
            it('escapes ' + c.name, function () {
                assert.strictEqual(neutralize(c.input), c.expected);
            });
        });
    });

    describe('neutralizes command substitution inside double quotes', function () {
        it('escapes $() inside double quotes', function () {
            // The opening $( is broken; the closing ) is literal inside quotes.
            assert.strictEqual(neutralize('"$(whoami)"'), '"\\$\\(whoami)"');
        });

        it('escapes backticks inside double quotes', function () {
            assert.strictEqual(neutralize('"`id`"'), '"\\`id\\`"');
        });
    });

    describe('strips newlines that would act as command separators', function () {
        it('removes a bare LF', function () {
            assert.strictEqual(neutralize('a\nwhoami'), 'awhoami');
        });

        it('removes a CRLF', function () {
            assert.strictEqual(neutralize('a\r\nwhoami'), 'awhoami');
        });
    });

    describe('does not double-escape a value it produced (idempotent)', function () {
        it('leaves an already-neutralized value unchanged', function () {
            const once = neutralize('; whoami');
            assert.strictEqual(neutralize(once), once);
        });
    });
});
