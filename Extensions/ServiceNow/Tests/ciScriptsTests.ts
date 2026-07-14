// Tests for CI pipeline scripts (DetermineCiTestPipelineName.ps1 and TriggerCiTestsForExtensions.ps1).

import assert = require('assert');
import fs = require('fs');
import { determineCiScriptPath, triggerCiScriptPath } from './helpers';

describe('CI Scripts Suite', function () {

    describe('DetermineCiTestPipelineName.ps1', function () {

        let scriptContent: string;

        before(function () {
            scriptContent = fs.readFileSync(determineCiScriptPath, 'utf-8');
        });

        it('should exist and be non-empty', function () {
            assert.ok(scriptContent.length > 0, 'script should be non-empty');
        });

        it('should contain a switch statement for extension mapping', function () {
            assert.ok(scriptContent.includes('switch'), 'should contain a switch statement');
        });

        it('should map ServiceNow extension to a pipeline name', function () {
            assert.ok(scriptContent.includes('ServiceNow'),
                'should reference ServiceNow in mapping');
        });

        it('should map TeamCity extension to a pipeline name', function () {
            assert.ok(scriptContent.includes('TeamCity'),
                'should reference TeamCity in mapping');
        });

        it('should map all expected extensions', function () {
            const expectedExtensions = ['Ansible', 'BitBucket', 'ExternalTfs', 'IISWebAppDeploy', 'ServiceNow', 'TeamCity'];
            expectedExtensions.forEach(ext => {
                assert.ok(scriptContent.includes(ext),
                    `should reference ${ext} in mapping`);
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
        let pipelineMappingBlock: string;

        function parseTriggerScript(): Map<string, string> {
            // Extract only the $pipelineMapping = @{...} block
            const mappingStart = scriptContent.indexOf('$pipelineMapping = @{');
            if (mappingStart === -1) {
                return new Map();
            }
            const blockStart = scriptContent.indexOf('{', mappingStart);
            let braceCount = 0;
            let blockEnd = blockStart;
            for (let i = blockStart; i < scriptContent.length; i++) {
                if (scriptContent[i] === '{') braceCount++;
                if (scriptContent[i] === '}') braceCount--;
                if (braceCount === 0) { blockEnd = i; break; }
            }
            pipelineMappingBlock = scriptContent.substring(blockStart, blockEnd + 1);

            const mapping = new Map<string, string>();
            const regex = /["'](\w+)["']\s*=\s*["']([^"']+)["']/g;
            let match;
            while ((match = regex.exec(pipelineMappingBlock)) !== null) {
                mapping.set(match[1], match[2]);
            }
            return mapping;
        }

        before(function () {
            scriptContent = fs.readFileSync(triggerCiScriptPath, 'utf-8');
        });

        it('should exist and be non-empty', function () {
            assert.ok(scriptContent.length > 0, 'script should be non-empty');
        });

        it('should define a $pipelineMapping hashtable', function () {
            assert.ok(scriptContent.includes('$pipelineMapping'),
                'should define $pipelineMapping');
        });

        it('should map ServiceNow extension', function () {
            const mapping = parseTriggerScript();
            assert.ok(mapping.has('ServiceNow'),
                'pipelineMapping should include ServiceNow');
        });

        it('should map TeamCity extension', function () {
            const mapping = parseTriggerScript();
            assert.ok(mapping.has('TeamCity'),
                'pipelineMapping should include TeamCity');
        });

        it('should map all expected extensions', function () {
            const mapping = parseTriggerScript();
            const expectedExtensions = ['Ansible', 'BitBucket', 'ExternalTfs', 'IISWebAppDeploy', 'ServiceNow', 'TeamCity'];
            expectedExtensions.forEach(ext => {
                assert.ok(mapping.has(ext),
                    `pipelineMapping should include ${ext}`);
            });
        });

        it('should have non-empty pipeline names for all mappings', function () {
            const mapping = parseTriggerScript();
            mapping.forEach((value, key) => {
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

        it('should have same extensions mapped in both scripts', function () {
            const determineContent = fs.readFileSync(determineCiScriptPath, 'utf-8');
            const triggerContent = fs.readFileSync(triggerCiScriptPath, 'utf-8');

            // Extract extensions from trigger script's $pipelineMapping block
            const mappingStart = triggerContent.indexOf('$pipelineMapping = @{');
            const blockStart = triggerContent.indexOf('{', mappingStart);
            let braceCount = 0;
            let blockEnd = blockStart;
            for (let i = blockStart; i < triggerContent.length; i++) {
                if (triggerContent[i] === '{') braceCount++;
                if (triggerContent[i] === '}') braceCount--;
                if (braceCount === 0) { blockEnd = i; break; }
            }
            const mappingBlock = triggerContent.substring(blockStart, blockEnd + 1);

            const triggerExtensions: string[] = [];
            const regex = /["'](\w+)["']\s*=\s*["']/g;
            let match;
            while ((match = regex.exec(mappingBlock)) !== null) {
                triggerExtensions.push(match[1]);
            }

            // Verify each trigger extension appears in determine script
            triggerExtensions.forEach(ext => {
                assert.ok(determineContent.includes(ext),
                    `Extension "${ext}" mapped in TriggerCiTests should also appear in DetermineCiTestPipelineName`);
            });
        });
    });
});
