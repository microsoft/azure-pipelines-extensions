// Tests for UpdateServiceNowChangeRequest task.json (all versions).

import assert = require('assert');
import { updateTaskV0Path, updateTaskV1Path, updateTaskV2Path, loadJson } from '../../helpers';

describe('UpdateServiceNowChangeRequest Suite', function () {

    const taskVersions = [
        { label: 'V0', path: updateTaskV0Path },
        { label: 'V1', path: updateTaskV1Path },
        { label: 'V2', path: updateTaskV2Path },
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
                assert.strictEqual(task.id.toUpperCase(), '37AC13CA-AEAD-4E19-A5AC-E5366051FC1C',
                    'all versions should share the same task id');
            });

            it('should have name "UpdateServiceNowChangeRequest"', function () {
                assert.strictEqual(task.name, 'UpdateServiceNowChangeRequest');
            });

            it('should run on Server', function () {
                assert.ok(task.runsOn.includes('Server'), 'should include Server in runsOn');
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

            it('should require ChangeRequestNumber input', function () {
                const input = task.inputs.find((i: any) => i.name === 'ChangeRequestNumber');
                assert.ok(input, 'ChangeRequestNumber input should exist');
                assert.strictEqual(input.required, true);
            });

            if (label !== 'V0') {
                it('should have UpdateStatus boolean input', function () {
                    const input = task.inputs.find((i: any) => i.name === 'UpdateStatus');
                    assert.ok(input, 'UpdateStatus input should exist');
                    assert.strictEqual(input.type, 'boolean');
                });

                it('should have NewStatus input visible when UpdateStatus is true', function () {
                    const input = task.inputs.find((i: any) => i.name === 'NewStatus');
                    assert.ok(input, 'NewStatus input should exist');
                    assert.ok(input.visibleRule.includes('UpdateStatus = true'));
                });
            }

            it('should have CloseCode and CloseNotes inputs', function () {
                const closeCode = task.inputs.find((i: any) => i.name === 'CloseCode');
                const closeNotes = task.inputs.find((i: any) => i.name === 'CloseNotes');

                assert.ok(closeCode, 'CloseCode input should exist');
                assert.ok(closeNotes, 'CloseNotes input should exist');
            });

            it('should use HttpRequestChain execution', function () {
                assert.ok(task.execution.HttpRequestChain, 'should have HttpRequestChain execution');
                assert.ok(task.execution.HttpRequestChain.Execute, 'should have Execute array');
                assert.ok(task.execution.HttpRequestChain.Execute.length > 0, 'should have at least one request');
            });

            it('should POST to import API for updates', function () {
                const chain = task.execution.HttpRequestChain.Execute;
                const postSteps = chain.filter(
                    (step: any) => step.RequestInputs.Method === 'POST'
                );
                assert.ok(postSteps.length > 0, 'should have POST steps for updates');

                const importStep = postSteps.find(
                    (step: any) => step.RequestInputs.EndpointUrl.includes('/api/now/import/x_mioms_azpipeline_change_request_import')
                );
                assert.ok(importStep, 'should POST to the change_request_import endpoint');
            });
        });
    });
});
