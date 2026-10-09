const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const packageRoots = [
    '.',
    'Extensions/Ansible/Src/Tasks/Ansible',
    'Extensions/ArtifactEngine',
    'Extensions/ArtifactEngineV2',
    'Extensions/BitBucket/Src/Tasks/DownloadArtifactsBitbucket',
    'Extensions/ExternalTfs/Src/Tasks/DownloadArtifactsTfsGit',
    'Extensions/ExternalTfs/Src/Tasks/DownloadExternalBuildArtifacts',
    'Extensions/TeamCity/Src/Tasks/DownloadTeamCityArtifacts'
];
const minimumVersions = { 1: 20, 2: 6, 5: 11 };

function probe(packagePath) {
    const module = require(packagePath);
    const expand = typeof module === 'function' ? module : module.expand;
    assert.equal(typeof expand, 'function');
    assert.deepEqual(expand('a{b,c}d'), ['abd', 'acd']);
    assert.deepEqual(expand('x{{a,b}}y'), ['x{a}y', 'x{b}y']);
    assert.deepEqual(expand('a{1..3}b'), ['a1b', 'a2b', 'a3b']);
    assert.deepEqual(expand('literal'), ['literal']);
    assert.deepEqual(expand('a\\{b,c\\}d'), ['a{b,c}d']);

    const payloads = [
        '{a,'.repeat(5000) + 'z' + '}'.repeat(5000),
        '{'.repeat(4000) + 'a,b' + '}'.repeat(4000),
        '{' + '{a},'.repeat(16000) + 'b}',
        '{{x},' + 'a,'.repeat(150000) + 'b}'
    ];
    for (const payload of payloads) {
        assert.ok(Array.isArray(expand(payload)));
        assert.ok(Array.isArray(expand(payload, { max: 1, maxLength: 1 })));
    }
}

function validate(build) {
    let count = 0;
    for (const root of packageRoots) {
        // The repository root is not copied into the extension build output.
        if (build && root === '.') continue;
        const base = build ? path.join(repoRoot, '_build') : repoRoot;
        const directory = path.resolve(base, root);
        const lock = JSON.parse(fs.readFileSync(path.join(directory, 'package-lock.json'), 'utf8'));
        let found = false;
        for (const [relativePath, entry] of Object.entries(lock.packages)) {
            if (!relativePath.endsWith('node_modules/brace-expansion')) continue;
            found = true;
            const [major, minor, patch] = entry.version.split('.').map(Number);
            assert.ok(Object.hasOwn(minimumVersions, major), `Unreviewed brace-expansion major: ${entry.version}`);
            assert.ok(minor > (major === 5 ? 0 : 1) ||
                (minor === (major === 5 ? 0 : 1) && patch >= minimumVersions[major]),
                `Vulnerable lock entry: ${directory}: ${relativePath}@${entry.version}`);
            const packagePath = path.join(directory, relativePath);
            const installed = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
            assert.equal(installed.version, entry.version, `Installed dependency differs from lock: ${packagePath}`);
            const result = cp.spawnSync(process.execPath, [__filename, '--probe', packagePath], {
                encoding: 'utf8',
                timeout: 60000
            });
            assert.ifError(result.error);
            assert.equal(result.status, 0, `${packagePath}\n${result.stdout}\n${result.stderr}`);
            console.log(`PASS ${path.relative(repoRoot, packagePath)}@${entry.version}`);
            count++;
        }
        assert.ok(found, `No brace-expansion lock entries in ${directory}`);
    }
    console.log(`Validated ${count} ${build ? 'built' : 'source'} brace-expansion installations.`);
}

if (process.argv[2] === '--probe') {
    probe(process.argv[3]);
} else {
    assert.ok(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--build'),
        'Usage: node scripts/test-brace-expansion.js [--build]');
    validate(process.argv[2] === '--build');
}
