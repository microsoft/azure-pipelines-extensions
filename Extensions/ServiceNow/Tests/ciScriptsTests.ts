// Tests for CI pipeline scripts (DetermineCiTestPipelineName.ps1 and TriggerCiTestsForExtensions.ps1).

import assert = require('assert');
import fs = require('fs');
import { determineCiScriptPath, triggerCiScriptPath } from './helpers';

// Parse the switch statement in DetermineCiTestPipelineName.ps1 to extract extension→pipeline mappings.
function parseDetermineScript(content: string): Map<string, string> {
    const mapping = new Map<string, string>();
    // Match lines like:  "ExtensionName" { $pipelineName = "PipelineName" }
    const regex = /["'](\w+)["']\s*\{\s*\$\w+\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        mapping.set(match[1], match[2]);
    }
    return mapping;
}

// Parse the $pipelineMapping hashtable in TriggerCiTestsForExtensions.ps1.
function parseTriggerScript(content: string): Map<string, string> {
    const mappingStart = content.indexOf('$pipelineMapping = @{');
    if (mappingStart === -1) {
        return new Map();
    }
    const blockStart = content.indexOf('{', mappingStart);
    // Brace-counting to find the matching closing brace.
    // Note: assumes no unescaped braces inside string values within this block.
    let braceCount = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) { blockEnd = i; break; }
    }
    const pipelineMappingBlock = content.substring(blockStart, blockEnd + 1);

    const mapping = new Map<string, string>();
    const regex = /["'](\w+)["']\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(pipelineMappingBlock)) !== null) {
        mapping.set(match[1], match[2]);
    }
    return mapping;
}

describe('CI Scripts Suite', function () {

    describe('DetermineCiTestPipelineName.ps1', function () {

        let scriptContent: string;
        let determineMapping: Map<string, string>;

        before(function () {
            scriptContent = fs.readFileSync(determineCiScriptPath, 'utf-8');
            determineMapping = parseDetermineScript(scriptContent);
        });

        it('should exist and be non-empty', function () {
            assert.ok(scriptContent.length > 0, 'script should be non-empty');
        });

        it('should contain a switch statement for extension mapping', function () {
            assert.ok(scriptContent.includes('switch'), 'should contain a switch statement');
        });

        it('should map ServiceNow extension to a pipeline name', function () {
            assert.ok(determineMapping.has('ServiceNow'),
                'parsed switch should include ServiceNow');
        });

        it('should map TeamCity extension to a pipeline name', function () {
            assert.ok(determineMapping.has('TeamCity'),
                'parsed switch should include TeamCity');
        });

        it('should map all expected extensions', function () {
            const expectedExtensions = ['Ansible', 'BitBucket', 'ExternalTfs', 'IISWebAppDeploy', 'ServiceNow', 'TeamCity'];
            expectedExtensions.forEach(ext => {
                assert.ok(determineMapping.has(ext),
                    `parsed switch should include ${ext}`);
            });
        });

        it('should have non-empty pipeline names for all mappings', function () {
            determineMapping.forEach((value, key) => {
                assert.ok(value.length > 0,
                    `pipeline name for ${key} should be non-empty`);
            });
        });

        it('should produce pipeline name output', function () {
            assert.ok(
                scriptContent.includes('pipelineName') || scriptContent.includes('PipelineName'),
                'should reference pipelineName variable'
            );
        });
    });

    describe('TriggerCiTestsForExtensions.ps1', function () {

        let scriptContent: string;
        let triggerMapping: Map<string, string>;

        before(function () {
            scriptContent = fs.readFileSync(triggerCiScriptPath, 'utf-8');
            triggerMapping = parseTriggerScript(scriptContent);
        });

        it('should exist and be non-empty', function () {
            assert.ok(scriptContent.length > 0, 'script should be non-empty');
        });

        it('should define a $pipelineMapping hashtable', function () {
            assert.ok(scriptContent.includes('$pipelineMapping'),
                'should define $pipelineMapping');
        });

        it('should map ServiceNow extension', function () {
            assert.ok(triggerMapping.has('ServiceNow'),
                'pipelineMapping should include ServiceNow');
        });

        it('should map TeamCity extension', function () {
            assert.ok(triggerMapping.has('TeamCity'),
                'pipelineMapping should include TeamCity');
        });

        it('should map all expected extensions', function () {
            const expectedExtensions = ['Ansible', 'BitBucket', 'ExternalTfs', 'IISWebAppDeploy', 'ServiceNow', 'TeamCity'];
            expectedExtensions.forEach(ext => {
                assert.ok(triggerMapping.has(ext),
                    `pipelineMapping should include ${ext}`);
            });
        });

        it('should have non-empty pipeline names for all mappings', function () {
            triggerMapping.forEach((value, key) => {
                assert.ok(value.length > 0,
                    `pipeline name for ${key} should be non-empty`);
            });
        });

        it('should use OrgUrl parameter for Azure DevOps API calls', function () {
            assert.ok(
                scriptContent.includes('OrgUrl') || scriptContent.includes('orgUrl'),
                'should reference OrgUrl parameter for API calls'
            );
        });
    });

    describe('Cross-script consistency', function () {

        let determineMapping: Map<string, string>;
        let triggerMapping: Map<string, string>;

        before(function () {
            const determineContent = fs.readFileSync(determineCiScriptPath, 'utf-8');
            const triggerContent = fs.readFileSync(triggerCiScriptPath, 'utf-8');
            determineMapping = parseDetermineScript(determineContent);
            triggerMapping = parseTriggerScript(triggerContent);
        });

        it('every trigger-script extension should appear in the determine script', function () {
            triggerMapping.forEach((_value, ext) => {
                assert.ok(determineMapping.has(ext),
                    `Extension "${ext}" mapped in TriggerCiTests should also appear in DetermineCiTestPipelineName`);
            });
        });

        it('every determine-script extension should appear in the trigger script', function () {
            determineMapping.forEach((_value, ext) => {
                assert.ok(triggerMapping.has(ext),
                    `Extension "${ext}" mapped in DetermineCiTestPipelineName should also appear in TriggerCiTests`);
            });
        });

        it('both scripts should map the exact same set of extensions', function () {
            const determineKeys = Array.from(determineMapping.keys()).sort();
            const triggerKeys = Array.from(triggerMapping.keys()).sort();
            assert.deepStrictEqual(determineKeys, triggerKeys,
                'both scripts should map identical extension sets');
        });
    });
});
