// Tests for CreateAndQueryChangeRequest task.json (all versions) and V2 advanced features.

import assert = require('assert');
import {
    createTaskV0Path, createTaskV1Path, createTaskV2Path, loadJson
} from '../../helpers';

describe('CreateAndQueryChangeRequest Suite', function () {

    const taskVersions = [
        { label: 'V0', path: createTaskV0Path },
        { label: 'V1', path: createTaskV1Path },
        { label: 'V2', path: createTaskV2Path },
    ];

    taskVersions.forEach(({ label, path: taskPath }) => {
        describe(label, function () {

            let task: any;

            before(function () {
                task = loadJson(taskPath);
            });

            it('should be valid JSON', function () {
                assert.ok(task, 'task.json should parse without errors');
            });

            it('should have a valid GUID as id', function () {
                assert.ok(/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/.test(task.id),
                    `task id "${task.id}" should be a valid GUID`);
            });

            it('should have consistent task id across versions', function () {
                assert.strictEqual(task.id.toUpperCase(), '539E1E16-0680-4F8E-85D0-95B6FDE76E8C',
                    'all versions should share the same task id');
            });

            it('should have name "CreateAndQueryChangeRequest"', function () {
                assert.strictEqual(task.name, 'CreateAndQueryChangeRequest');
            });

            it('should run on ServerGate', function () {
                assert.ok(task.runsOn.includes('ServerGate'), 'should include ServerGate in runsOn');
            });

            it('should have a valid version object', function () {
                assert.ok(Number.isInteger(task.version.Major), 'Major should be an integer');
                assert.ok(Number.isInteger(task.version.Minor), 'Minor should be an integer');
                assert.ok(Number.isInteger(task.version.Patch), 'Patch should be an integer');
            });

            it('should require ServiceNowConnection input', function () {
                const input = task.inputs.find((i: any) => i.name === 'ServiceNowConnection');
                assert.ok(input, 'ServiceNowConnection input should exist');
                assert.strictEqual(input.type, 'connectedService:ServiceNow');
                assert.strictEqual(input.required, 'true');
            });

            if (label !== 'V0') {
                it('should have changeRequestAction input with createNew and useExisting options', function () {
                    const input = task.inputs.find((i: any) => i.name === 'changeRequestAction');
                    assert.ok(input, 'changeRequestAction input should exist');
                    assert.ok(input.options.createNew, 'should have createNew option');
                    assert.ok(input.options.useExisting, 'should have useExisting option');
                    assert.strictEqual(input.defaultValue, 'createNew');
                });

                it('should have changeType input with Normal, Standard, and Emergency options', function () {
                    const input = task.inputs.find((i: any) => i.name === 'changeType');
                    assert.ok(input, 'changeType input should exist');
                    assert.ok(input.options.Normal, 'should have Normal option');
                    assert.ok(input.options.Standard, 'should have Standard option');
                    assert.ok(input.options.Emergency, 'should have Emergency option');
                });

                it('should have shortdescription as required input for createNew', function () {
                    const input = task.inputs.find((i: any) => i.name === 'shortdescription');
                    assert.ok(input, 'shortdescription input should exist');
                    assert.strictEqual(input.required, 'true');
                    assert.ok(input.visibleRule.includes('changeRequestAction = createNew'));
                });
            }

            it('should use HttpRequestChain execution', function () {
                assert.ok(task.execution.HttpRequestChain, 'should have HttpRequestChain execution');
                assert.ok(task.execution.HttpRequestChain.Execute, 'should have Execute array');
                assert.ok(task.execution.HttpRequestChain.Execute.length > 0, 'should have at least one request in chain');
            });

            it('should produce CHANGE_REQUEST_NUMBER and CHANGE_SYSTEM_ID output variables', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const allOutputVars = chain
                    .filter((step: any) => step.ExecutionOptions && step.ExecutionOptions.OutputVariables)
                    .map((step: any) => step.ExecutionOptions.OutputVariables)
                    .join(' ');

                assert.ok(allOutputVars.includes('CHANGE_REQUEST_NUMBER'), 'should output CHANGE_REQUEST_NUMBER');
                assert.ok(allOutputVars.includes('CHANGE_SYSTEM_ID'), 'should output CHANGE_SYSTEM_ID');
            });

            it('should POST to import API for creating change requests', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const postSteps = chain.filter(
                    (step: any) => step.RequestInputs.Method === 'POST'
                );
                assert.ok(postSteps.length > 0, 'should have POST steps');

                const importStep = postSteps.find(
                    (step: any) => step.RequestInputs.EndpointUrl.includes('/api/now/import/x_mioms_azpipeline_change_request_import')
                );
                assert.ok(importStep, 'should POST to the change_request_import endpoint');
            });

            it('should GET from table API for querying change requests', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const getSteps = chain.filter(
                    (step: any) => step.RequestInputs.Method === 'GET'
                );
                assert.ok(getSteps.length > 0, 'should have GET steps');

                const tableStep = getSteps.find(
                    (step: any) => step.RequestInputs.EndpointUrl.includes('/api/now/table/change_request')
                );
                assert.ok(tableStep, 'should GET from the change_request table');
            });

            it('should set Content-Type and Accept headers to application/json', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                chain.forEach((step: any, index: number) => {
                    if (step.RequestInputs.Headers) {
                        const headers = JSON.parse(step.RequestInputs.Headers);
                        assert.strictEqual(headers['Content-Type'], 'application/json',
                            `step ${index} should have Content-Type: application/json`);
                        assert.strictEqual(headers['Accept'], 'application/json',
                            `step ${index} should have Accept: application/json`);
                    }
                });
            });

            it('should have dataSourceBindings for picklist inputs', function () {
                assert.ok(task.dataSourceBindings, 'dataSourceBindings should exist');
                assert.ok(task.dataSourceBindings.length > 0, 'should have at least one data source binding');

                const targets = task.dataSourceBindings.map((b: any) => b.target);
                assert.ok(targets.includes('DesiredExitStatus'), 'should bind DesiredExitStatus');
                assert.ok(targets.includes('priority'), 'should bind priority');
                assert.ok(targets.includes('risk'), 'should bind risk');
                assert.ok(targets.includes('impact'), 'should bind impact');
            });
        });
    });

    describe('V2 Advanced Features', function () {

        let task: any;

        before(function () {
            task = loadJson(createTaskV2Path);
        });

        describe('Success criteria inputs', function () {

            it('should have successCriteria input with desiredStatus and advanced options', function () {
                const input = task.inputs.find((i: any) => i.name === 'successCriteria');
                assert.ok(input, 'successCriteria input should exist');
                assert.ok(input.options.desiredStatus, 'should have desiredStatus option');
                assert.ok(input.options.advanced, 'should have advanced option');
                assert.strictEqual(input.defaultValue, 'desiredStatus');
            });

            it('should have DesiredExitStatus input visible when successCriteria = desiredStatus', function () {
                const input = task.inputs.find((i: any) => i.name === 'DesiredExitStatus');
                assert.ok(input, 'DesiredExitStatus input should exist');
                assert.ok(input.visibleRule.includes('successCriteria = desiredStatus'));
            });

            it('should have AdvancedSuccessCriteria input visible when successCriteria = advanced', function () {
                const input = task.inputs.find((i: any) => i.name === 'AdvancedSuccessCriteria');
                assert.ok(input, 'AdvancedSuccessCriteria input should exist');
                assert.ok(input.visibleRule.includes('successCriteria = advanced'));
            });
        });

        describe('useExisting flow inputs', function () {

            it('should have changeQueryCriteria input with changeRequestNumber and queryString options', function () {
                const input = task.inputs.find((i: any) => i.name === 'changeQueryCriteria');
                assert.ok(input, 'changeQueryCriteria input should exist');
                assert.ok(input.options.changeRequestNumber, 'should have changeRequestNumber option');
                assert.ok(input.options.queryString, 'should have queryString option');
                assert.ok(input.visibleRule.includes('changeRequestAction = useExisting'));
            });

            it('should have changeRequestNumber input visible for useExisting + changeRequestNumber', function () {
                const input = task.inputs.find((i: any) => i.name === 'changeRequestNumber');
                assert.ok(input, 'changeRequestNumber input should exist');
                assert.ok(input.visibleRule.includes('changeRequestAction = useExisting'));
                assert.ok(input.visibleRule.includes('changeQueryCriteria = changeRequestNumber'));
            });

            it('should have queryString input visible for useExisting + queryString', function () {
                const input = task.inputs.find((i: any) => i.name === 'queryString');
                assert.ok(input, 'queryString input should exist');
                assert.ok(input.visibleRule.includes('changeRequestAction = useExisting'));
                assert.ok(input.visibleRule.includes('changeQueryCriteria = queryString'));
            });
        });

        describe('Checks vs Release dual execution paths', function () {

            it('should have separate POST steps for checks and release hosttype', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const postSteps = chain.filter(
                    (step: any) => step.RequestInputs.Method === 'POST'
                );
                assert.ok(postSteps.length >= 2, `should have at least 2 POST steps, found ${postSteps.length}`);
            });

            it('should have SkipSectionExpression referencing system.hosttype for checks path', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const checksSteps = chain.filter(
                    (step: any) => step.ExecutionOptions &&
                        step.ExecutionOptions.SkipSectionExpression &&
                        step.ExecutionOptions.SkipSectionExpression.includes('system.hosttype')
                );
                assert.ok(checksSteps.length > 0, 'should have steps with system.hosttype SkipSectionExpression');
            });

            it('should reference checks-specific variables (stageId, buildId, stageAttempt)', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const allUrls = chain.map((step: any) => step.RequestInputs.EndpointUrl).join(' ');
                const allBodies = chain
                    .filter((step: any) => step.RequestInputs.Body)
                    .map((step: any) => step.RequestInputs.Body)
                    .join(' ');
                const combined = allUrls + allBodies;

                assert.ok(combined.includes('checks.stageId') || combined.includes('system.stageId'),
                    'should reference stageId for checks context');
                assert.ok(combined.includes('build.buildId'),
                    'should reference build.buildId');
            });

            it('should have a WaitForCompletion gate step (polling step)', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const waitSteps = chain.filter(
                    (step: any) => step.RequestInputs.WaitForCompletion === 'true'
                );
                assert.ok(waitSteps.length > 0, 'should have at least one step with WaitForCompletion=true');
            });
        });

        describe('Output variables', function () {

            it('should produce CHANGE_CORRELATION_ID output variable', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const allOutputVars = chain
                    .filter((step: any) => step.ExecutionOptions && step.ExecutionOptions.OutputVariables)
                    .map((step: any) => step.ExecutionOptions.OutputVariables)
                    .join(' ');

                assert.ok(allOutputVars.includes('CHANGE_CORRELATION_ID'), 'should output CHANGE_CORRELATION_ID');
            });
        });

        describe('Additional inputs', function () {

            it('should have otherParameters as multiLine input', function () {
                const input = task.inputs.find((i: any) => i.name === 'otherParameters');
                assert.ok(input, 'otherParameters input should exist');
                assert.strictEqual(input.type, 'multiLine');
            });

            it('should have schedule group inputs (schedulestarttime, scheduleendtime)', function () {
                const start = task.inputs.find((i: any) => i.name === 'schedulestarttime');
                const end = task.inputs.find((i: any) => i.name === 'scheduleendtime');
                assert.ok(start, 'schedulestarttime input should exist');
                assert.ok(end, 'scheduleendtime input should exist');
            });

            it('should have standardChangeTemplate input visible for Standard change type', function () {
                const input = task.inputs.find((i: any) => i.name === 'standardChangeTemplate');
                assert.ok(input, 'standardChangeTemplate input should exist');
                assert.ok(input.visibleRule.includes('changeType = Standard'));
            });
        });
    });
});
