const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function testExtensionSelection() {
    const source = fs.readFileSync(path.join(__dirname, '..', 'gulpfile.js'), 'utf8');
    const start = source.indexOf('const SHARED_INFRA_PREFIXES =');
    const end = source.indexOf('// Discover extensions that have Src/vss-extension.json', start);
    assert.ok(start >= 0 && end > start, 'Extension-selection implementation must be present');
    const selection = vm.runInNewContext(
        source.slice(start, end) + '\n({ resolveChangedExtensions, SHARED_PUBLICATION_PREFIXES })',
        { console: { log() {} } });
    const publishable = ['Ansible', 'BitBucket', 'ExternalTfs', 'IISWebAppDeploy', 'ServiceNow', 'TeamCity'];
    const filter = name => publishable.includes(name);
    const select = files => selection.resolveChangedExtensions(files, filter, selection.SHARED_PUBLICATION_PREFIXES);
    const libraries = [
        'Extensions/ArtifactEngine/Engine/logger.ts',
        'Extensions/ArtifactEngine/package.json',
        'Extensions/ArtifactEngineV2/EngineTests/loggerTests.ts',
        'Extensions/ArtifactEngineV2/package-lock.json'
    ];
    const buildOnly = ['gulpfile.js', 'scripts/test-extension-selection.js', '.pipelines/1es-migration/azure-pipelines-integration.yml'];

    assert.equal(select(libraries).length, 0, 'Library-only changes must not publish Marketplace extensions');
    assert.equal(select(buildOnly).length, 0, 'Build/test-only changes must not publish Marketplace extensions');
    assert.equal(select([...libraries, ...buildOnly]).length, 0);
    assert.equal(selection.resolveChangedExtensions(libraries, filter), null, 'Library changes must still run all unit suites');
    assert.equal(selection.resolveChangedExtensions(buildOnly, filter), null, 'Build/test changes must still run all unit suites');
    assert.equal(select([...libraries, 'Extensions/TeamCity/Src/Tasks/DownloadTeamCityArtifacts/task.json']).join(), 'TeamCity');
    assert.equal(select(['Extensions/Ansible/Src/vss-extension.json', 'Extensions/BitBucket/Src/task.ts']).join(), 'Ansible,BitBucket');
    assert.equal(select(['Extensions/TeamCity/Src/README.md']).join(), 'TeamCity');
    assert.equal(select(['README.md']).length, 0);
    assert.equal(select([]).length, 0);
    for (const file of ['Extensions/Common/lib/common.ts', 'common.json', 'externals.json', 'TaskModules/module.ts', 'package.json', 'package-lock.json', 'package.js', 'package-utils.js', 'base.tsconfig.json', 'tsconfig.json']) {
        assert.equal(select([...libraries, file]), null, `${file} must still validate all extension versions before publication`);
    }
    console.log('Extension-selection regression checks passed.');
}

module.exports = testExtensionSelection;
if (require.main === module) {
    testExtensionSelection();
}
