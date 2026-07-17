// High-priority validation tests: visibleRules, pickList bindings, expressions, data sources, and cross-version checks.

import assert = require('assert');
import {
    extensionManifestPath, srcRoot,
    createTaskV0Path, createTaskV1Path, createTaskV2Path,
    updateTaskV0Path, updateTaskV1Path, updateTaskV2Path,
    loadJson
} from './helpers';

describe('Validation Suite', function () {

    const allTaskPaths = [
        { label: 'CreateV0', path: createTaskV0Path },
        { label: 'CreateV1', path: createTaskV1Path },
        { label: 'CreateV2', path: createTaskV2Path },
        { label: 'UpdateV0', path: updateTaskV0Path },
        { label: 'UpdateV1', path: updateTaskV1Path },
        { label: 'UpdateV2', path: updateTaskV2Path },
    ];

    describe('VisibleRule input reference validation', function () {

        // Tokenize a visibleRule into the LHS input names it references.
        // Rules have the form: "inputA = valueA && inputB = valueB"
        function extractVisibleRuleInputRefs(rule: string): string[] {
            // Split on && and || (with optional whitespace), then extract LHS of each clause
            const clauses = rule.split(/\s*(?:&&|\|\|)\s*/);
            const refs: string[] = [];
            for (const clause of clauses) {
                const match = clause.trim().match(/^(\w+)\s*=/);
                if (match) {
                    const name = match[1];
                    // Skip boolean literals that aren't input names
                    if (!['true', 'false'].includes(name.toLowerCase())) {
                        refs.push(name);
                    }
                }
            }
            return refs;
        }

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            it(`${label}: all visibleRule references should point to existing inputs`, function () {
                const task = loadJson(taskPath);
                const inputNames = new Set(task.inputs.map((i: any) => i.name));

                task.inputs.forEach((input: any) => {
                    if (!input.visibleRule) return;

                    const refs = extractVisibleRuleInputRefs(input.visibleRule);
                    refs.forEach((refName) => {
                        assert.ok(inputNames.has(refName),
                            `Input "${input.name}" visibleRule references "${refName}" which does not exist in ${label} inputs`);
                    });
                });
            });
        });

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            it(`${label}: all group visibleRules should reference existing inputs`, function () {
                const task = loadJson(taskPath);
                const inputNames = new Set(task.inputs.map((i: any) => i.name));
                const groups = task.groups || [];

                groups.forEach((group: any) => {
                    if (!group.visibleRule) return;

                    const refs = extractVisibleRuleInputRefs(group.visibleRule);
                    refs.forEach((refName) => {
                        assert.ok(inputNames.has(refName),
                            `Group "${group.name}" visibleRule references "${refName}" which does not exist in ${label} inputs`);
                    });
                });
            });
        });
    });

    describe('PickList binding completeness', function () {

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            it(`${label}: every pickList input should have options or a dataSourceBinding`, function () {
                const task = loadJson(taskPath);
                const boundTargets = new Set(
                    (task.dataSourceBindings || []).map((b: any) => b.target)
                );

                const pickListInputs = task.inputs.filter((i: any) => i.type === 'pickList');

                pickListInputs.forEach((input: any) => {
                    const hasOptions = input.options && Object.keys(input.options).length > 0;
                    const hasDsBinding = boundTargets.has(input.name);
                    assert.ok(hasOptions || hasDsBinding,
                        `pickList input "${input.name}" in ${label} has neither inline options nor a dataSourceBinding`);
                });
            });
        });
    });

    describe('GroupName references valid groups', function () {

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            it(`${label}: all input groupNames should reference existing groups`, function () {
                const task = loadJson(taskPath);
                const groupNames = new Set((task.groups || []).map((g: any) => g.name));

                task.inputs.forEach((input: any) => {
                    if (!input.groupName) return;
                    assert.ok(groupNames.has(input.groupName),
                        `Input "${input.name}" references group "${input.groupName}" which does not exist in ${label}`);
                });
            });
        });
    });

    describe('Expression balanced parentheses', function () {

        function hasBalancedParentheses(expr: string): boolean {
            let depth = 0;
            for (const ch of expr) {
                if (ch === '(') depth++;
                if (ch === ')') depth--;
                if (depth < 0) return false;
            }
            return depth === 0;
        }

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            it(`${label}: all SkipSectionExpression values should have balanced parentheses`, function () {
                const task = loadJson(taskPath);
                const chain = task.execution.HttpRequestChain.Execute;

                chain.forEach((step: any, index: number) => {
                    if (step.ExecutionOptions && step.ExecutionOptions.SkipSectionExpression) {
                        const expr = step.ExecutionOptions.SkipSectionExpression;
                        assert.ok(hasBalancedParentheses(expr),
                            `Step ${index} SkipSectionExpression has unbalanced parentheses in ${label}: "${expr.substring(0, 80)}..."`);
                    }
                });
            });
        });
    });

    describe('Update V2 checks execution path', function () {

        let task: any;

        before(function () {
            task = loadJson(updateTaskV2Path);
        });

        it('should include "Build" in visibility', function () {
            assert.ok(task.visibility.includes('Build'),
                'Update V2 should have Build in visibility');
            assert.ok(task.visibility.includes('Release'),
                'Update V2 should still have Release in visibility');
        });

        it('should have 3 execution steps', function () {
            const chain = task.execution.HttpRequestChain.Execute;
            assert.strictEqual(chain.length, 3,
                `Update V2 should have 3 execution steps, found ${chain.length}`);
        });

        it('should have a GET step referencing stageId/buildId/stageAttempt for checks context', function () {
            const chain = task.execution.HttpRequestChain.Execute;
            const checksStep = chain.find(
                (step: any) => step.RequestInputs.EndpointUrl.includes('system.stageId')
            );
            assert.ok(checksStep, 'should have a step with system.stageId');
            assert.ok(checksStep.RequestInputs.EndpointUrl.includes('build.buildId'),
                'checks step should reference build.buildId');
            assert.ok(checksStep.RequestInputs.EndpointUrl.includes('system.stageAttempt'),
                'checks step should reference system.stageAttempt');
        });

        it('should use SkipSectionExpression to distinguish ChangeRequestNumber present vs absent', function () {
            const chain = task.execution.HttpRequestChain.Execute;
            const step1Skip = chain[0].ExecutionOptions?.SkipSectionExpression || '';
            const step2Skip = chain[1].ExecutionOptions?.SkipSectionExpression || '';

            assert.ok(step1Skip.includes("taskInputs['ChangeRequestNumber']"),
                'step 1 should reference ChangeRequestNumber input');
            assert.ok(step2Skip.includes("taskInputs['ChangeRequestNumber']"),
                'step 2 should reference ChangeRequestNumber input');

            // One skips when empty, other skips when not empty
            assert.ok(step1Skip.includes('true') && step2Skip.includes('false'),
                'steps should have complementary skip conditions');
        });

        it('should query by correlation fields when ChangeRequestNumber is absent', function () {
            const chain = task.execution.HttpRequestChain.Execute;
            const correlationStep = chain.find(
                (step: any) => step.RequestInputs.EndpointUrl.includes('x_mioms_azpipeline_stage_id')
            );
            assert.ok(correlationStep, 'should have a correlation-based query step');
            assert.ok(correlationStep.RequestInputs.EndpointUrl.includes('x_mioms_azpipeline_build_id'),
                'should query by build_id');
            assert.ok(correlationStep.RequestInputs.EndpointUrl.includes('x_mioms_azpipeline_stage_attempt'),
                'should query by stage_attempt');
        });
    });

    describe('Update V2 visibility change', function () {

        it('should have V0 and V1 with only "Release" visibility', function () {
            const v0 = loadJson(updateTaskV0Path);
            const v1 = loadJson(updateTaskV1Path);
            assert.deepStrictEqual(v0.visibility, ['Release'],
                'V0 should only have Release visibility');
            assert.deepStrictEqual(v1.visibility, ['Release'],
                'V1 should only have Release visibility');
        });

        it('should have V2 with both "Build" and "Release" visibility', function () {
            const v2 = loadJson(updateTaskV2Path);
            assert.ok(v2.visibility.includes('Build'), 'V2 should include Build');
            assert.ok(v2.visibility.includes('Release'), 'V2 should include Release');
        });
    });

    describe('DataSource name evolution between versions', function () {

        it('Update V0/V1 should use "StateLabel"/"CloseCodeLabel" data sources', function () {
            const v0 = loadJson(updateTaskV0Path);
            const v1 = loadJson(updateTaskV1Path);

            [v0, v1].forEach((task) => {
                const bindings = task.dataSourceBindings || [];
                const stateBinding = bindings.find((b: any) => b.target === 'NewStatus');
                const closeBinding = bindings.find((b: any) => b.target === 'CloseCode');

                if (stateBinding) {
                    assert.strictEqual(stateBinding.dataSourceName, 'StateLabel',
                        'V0/V1 NewStatus should use StateLabel data source');
                }
                if (closeBinding) {
                    assert.strictEqual(closeBinding.dataSourceName, 'CloseCodeLabel',
                        'V0/V1 CloseCode should use CloseCodeLabel data source');
                }
            });
        });

        it('Update V2 should use "State"/"Close code" data sources (with value+label)', function () {
            const v2 = loadJson(updateTaskV2Path);
            const bindings = v2.dataSourceBindings || [];

            const stateBinding = bindings.find((b: any) => b.target === 'NewStatus');
            const closeBinding = bindings.find((b: any) => b.target === 'CloseCode');

            assert.ok(stateBinding, 'V2 should have NewStatus dataSourceBinding');
            assert.strictEqual(stateBinding.dataSourceName, 'State',
                'V2 NewStatus should use "State" data source (not StateLabel)');

            assert.ok(closeBinding, 'V2 should have CloseCode dataSourceBinding');
            assert.strictEqual(closeBinding.dataSourceName, 'Close code',
                'V2 CloseCode should use "Close code" data source (not CloseCodeLabel)');
        });
    });

    describe('Data source endpointUrl validation', function () {

        let dataSources: any[];

        before(function () {
            const manifest = loadJson(extensionManifestPath);
            const contributions = manifest.contributions || [];
            const endpoint = contributions.find(
                (c: any) => c.type === 'ms.vss-endpoint.service-endpoint-type'
            );
            dataSources = endpoint.properties.dataSources || [];
        });

        it('should have at least 17 data sources', function () {
            assert.ok(dataSources.length >= 17,
                `expected at least 17 data sources, found ${dataSources.length}`);
        });

        it('all endpointUrls should start with {{endpoint.url}} or {{{configuration.Url}}}', function () {
            dataSources.forEach((ds: any) => {
                const url = ds.endpointUrl;
                const validPrefix = url.startsWith('{{endpoint.url}}') ||
                    url.startsWith('{{{configuration.Url}}}');
                assert.ok(validPrefix,
                    `data source "${ds.name}" endpointUrl should start with a valid template prefix, got: "${url.substring(0, 40)}"`);
            });
        });

        it('TestConnection should include app_major_version=4', function () {
            const testConn = dataSources.find((ds: any) => ds.name === 'TestConnection');
            assert.ok(testConn, 'TestConnection data source should exist');
            assert.ok(testConn.endpointUrl.includes('app_major_version=4'),
                'TestConnection should reference app_major_version=4');
        });

        it('TestConnection should point to the azpipeline app_version API', function () {
            const testConn = dataSources.find((ds: any) => ds.name === 'TestConnection');
            assert.ok(testConn.endpointUrl.includes('/api/x_mioms_azpipeline/app_version'),
                'TestConnection should use the app_version API');
        });

        it('paginated data sources (Configuration Item, Assignment Group) should include sysparm_offset', function () {
            const paginatedSources = ['Configuration Item', 'Assignment Group'];
            paginatedSources.forEach((name) => {
                const ds = dataSources.find((d: any) => d.name === name);
                assert.ok(ds, `${name} data source should exist`);
                assert.ok(ds.endpointUrl.includes('sysparm_offset'),
                    `${name} should include sysparm_offset for pagination`);
                assert.ok(ds.endpointUrl.includes('sysparm_limit'),
                    `${name} should include sysparm_limit for pagination`);
            });
        });

        it('all data sources that query sys_choice should include sysparm_fields', function () {
            const choiceSources = dataSources.filter(
                (ds: any) => ds.endpointUrl.includes('/sys_choice')
            );
            choiceSources.forEach((ds: any) => {
                assert.ok(ds.endpointUrl.includes('sysparm_fields'),
                    `data source "${ds.name}" queries sys_choice but missing sysparm_fields`);
            });
        });
    });

    describe('Update V2 CloseCode visibleRule uses numeric state value', function () {

        it('V0 CloseCode should use "NewStatus = Closed"', function () {
            const v0 = loadJson(updateTaskV0Path);
            const closeCode = v0.inputs.find((i: any) => i.name === 'CloseCode');
            assert.ok(closeCode, 'CloseCode should exist in V0');
            assert.ok(closeCode.visibleRule.includes('Closed'),
                'V0 CloseCode visibleRule should reference "Closed" (label)');
        });

        it('V1 CloseCode should use "UpdateStatus = true && NewStatus = Closed"', function () {
            const v1 = loadJson(updateTaskV1Path);
            const closeCode = v1.inputs.find((i: any) => i.name === 'CloseCode');
            assert.ok(closeCode, 'CloseCode should exist in V1');
            assert.ok(closeCode.visibleRule.includes('UpdateStatus = true'),
                'V1 CloseCode should require UpdateStatus = true');
            assert.ok(closeCode.visibleRule.includes('Closed'),
                'V1 CloseCode should reference "Closed" (label)');
        });

        it('V2 CloseCode should use "UpdateStatus = true && NewStatus = 3"', function () {
            const v2 = loadJson(updateTaskV2Path);
            const closeCode = v2.inputs.find((i: any) => i.name === 'CloseCode');
            assert.ok(closeCode, 'CloseCode should exist in V2');
            assert.ok(closeCode.visibleRule.includes('UpdateStatus = true'),
                'V2 CloseCode should require UpdateStatus = true');
            assert.ok(closeCode.visibleRule.includes('NewStatus = 3'),
                'V2 CloseCode should use numeric value "3" (not label "Closed")');
        });
    });

    describe('HelpMarkDown validation', function () {

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            it(`${label}: all inputs should have helpMarkDown defined`, function () {
                const task = loadJson(taskPath);
                task.inputs.forEach((input: any) => {
                    assert.ok(input.helpMarkDown !== undefined && input.helpMarkDown !== null,
                        `Input "${input.name}" in ${label} should have helpMarkDown defined`);
                    // Allow empty string — only undefined/null is invalid
                });
            });
        });
    });

    describe('InstanceNameFormat validation', function () {

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            it(`${label}: should have non-empty instanceNameFormat`, function () {
                const task = loadJson(taskPath);
                assert.ok(task.instanceNameFormat && task.instanceNameFormat.length > 0,
                    `${label} should have a non-empty instanceNameFormat`);
            });
        });
    });
});
