const assert = require('node:assert/strict');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const packageRoots = [
    'Extensions/ArtifactEngine',
    'Extensions/ArtifactEngineV2',
    'Extensions/ExternalTfs/Src/Tasks/DownloadExternalBuildArtifacts',
    'Extensions/TeamCity/Src/Tasks/DownloadTeamCityArtifacts'
];

function probe(packageDirectory) {
    const manifestPath = require.resolve('handlebars/package.json', { paths: [packageDirectory] });
    const relativePath = path.relative(packageDirectory, manifestPath);
    assert.ok(!relativePath.startsWith('..') && !path.isAbsolute(relativePath),
        `Handlebars must be installed inside ${packageDirectory}`);

    const manifest = require(manifestPath);
    const [major, minor, patch] = manifest.version.split('.').map(Number);
    assert.ok(major === 4 && (minor > 7 || (minor === 7 && patch >= 10)),
        `Expected Handlebars >=4.7.10 <5, found ${manifest.version} in ${packageDirectory}`);

    const handlebars = require(path.dirname(manifestPath)).create();
    handlebars.registerHelper('hasValue', value => value !== undefined);
    const options = { allowProtoMethodsByDefault: true };
    const lookup = handlebars.compile('{{hasValue (lookup prototype "constructor")}}');
    for (const prototype of [Function.prototype, String.prototype, Object.prototype]) {
        assert.equal(lookup({ prototype }, options), 'false');
    }
    const nestedLookup = handlebars.compile('{{hasValue (lookup (lookup fn "__proto__") "constructor")}}');
    assert.equal(nestedLookup({ fn: function () {} }, options), 'false');

    assert.equal(handlebars.compile('{{lookup data "constructor"}}')({
        data: { constructor: 'ordinary data' }
    }), 'ordinary data');
    assert.equal(handlebars.compile('{{name}}:{{#each items}}{{this}}{{/each}}')({
        name: '<value>', items: ['a', 'b']
    }), '&lt;value&gt;:ab');
    console.log(`PASS ${path.relative(repoRoot, packageDirectory)}: handlebars@${manifest.version}`);
}

assert.ok(process.argv.length === 2 ||
    (process.argv.length === 3 && process.argv[2] === '--build'),
    'Usage: node scripts/test-handlebars.js [--build]');
const base = process.argv[2] === '--build' ? path.join(repoRoot, '_build') : repoRoot;
for (const root of packageRoots) {
    probe(path.resolve(base, root));
}
