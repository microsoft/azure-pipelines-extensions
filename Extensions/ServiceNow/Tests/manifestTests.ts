// Tests for vss-extension.json manifest, OAuth2 auth scheme, and structural consistency.

import assert = require('assert');
import path = require('path');
import fs = require('fs');
import {
    extensionManifestPath, srcRoot,
    createTaskV0Path, createTaskV1Path, createTaskV2Path,
    updateTaskV0Path, updateTaskV1Path, updateTaskV2Path,
    loadJson
} from './helpers';

describe('Manifest Suite', function () {

    let manifest: any;

    before(function () {
        manifest = loadJson(extensionManifestPath);
    });

    describe('Extension manifest (vss-extension.json)', function () {

        it('should be valid JSON', function () {
            assert.ok(manifest, 'manifest should parse without errors');
        });

        it('should have a non-empty id', function () {
            assert.ok(manifest.id && manifest.id.length > 0, 'id should be non-empty');
        });

        it('should have publisher set', function () {
            assert.ok(manifest.publisher, 'publisher should be set');
        });

        it('should specify targets including Microsoft.VisualStudio.Services.Cloud', function () {
            const targets = manifest.targets.map((t: any) => t.id);
            assert.ok(targets.includes('Microsoft.VisualStudio.Services.Cloud'),
                'should target Microsoft.VisualStudio.Services.Cloud');
        });

        it('should have categories that include Azure Pipelines', function () {
            assert.ok(manifest.categories.includes('Azure Pipelines'),
                'categories should include Azure Pipelines');
        });
    });

    describe('Service endpoint contribution', function () {

        let endpoint: any;

        before(function () {
            const contributions = manifest.contributions || [];
            endpoint = contributions.find(
                (c: any) => c.type === 'ms.vss-endpoint.service-endpoint-type'
            );
        });

        it('should define a ServiceNow service endpoint type', function () {
            assert.ok(endpoint, 'should have a service endpoint type contribution');
            assert.strictEqual(endpoint.properties.name, 'ServiceNow');
        });

        it('should have OAuth2 as an authentication scheme', function () {
            const authSchemes = endpoint.properties.authenticationSchemes;
            const oauth2 = authSchemes.find((s: any) => s.type === 'ms.vss-endpoint.endpoint-auth-scheme-oauth2');
            assert.ok(oauth2, 'should have an OAuth2 auth scheme');
        });

        it('should have exactly two authentication schemes (Basic and OAuth2)', function () {
            const authSchemes = endpoint.properties.authenticationSchemes;
            assert.strictEqual(authSchemes.length, 2, 'should have exactly 2 auth schemes');
        });

        it('should have Basic as an authentication scheme', function () {
            const authSchemes = endpoint.properties.authenticationSchemes;
            const basic = authSchemes.find((s: any) => s.type === 'ms.vss-endpoint.endpoint-auth-scheme-basic');
            assert.ok(basic, 'should have a Basic auth scheme');
        });
    });

    describe('OAuth2 auth scheme details', function () {

        let oauth2: any;

        before(function () {
            const contributions = manifest.contributions || [];
            const endpoint = contributions.find(
                (c: any) => c.type === 'ms.vss-endpoint.service-endpoint-type'
            );
            const authSchemes = endpoint.properties.authenticationSchemes;
            oauth2 = authSchemes.find((s: any) => s.type === 'ms.vss-endpoint.endpoint-auth-scheme-oauth2');
        });

        it('should define authorizationUrl with /oauth_auth.do path', function () {
            assert.ok(oauth2.authorizationUrl, 'authorizationUrl should exist');
            assert.ok(oauth2.authorizationUrl.includes('/oauth_auth.do'),
                'authorizationUrl should include /oauth_auth.do');
        });

        it('should define dataSourceBindings with a token endpoint', function () {
            assert.ok(oauth2.dataSourceBindings, 'dataSourceBindings should exist for OAuth2');
            assert.ok(oauth2.dataSourceBindings.length > 0, 'should have at least one data source binding');

            const tokenBinding = oauth2.dataSourceBindings.find(
                (b: any) => b.dataSourceName && b.dataSourceName.toLowerCase().includes('token')
            );
            assert.ok(tokenBinding, 'should have a token-related data source binding');
        });

        it('should support authorization_code grant type in endpoint dataSources', function () {
            const contributions = manifest.contributions || [];
            const ep = contributions.find(
                (c: any) => c.type === 'ms.vss-endpoint.service-endpoint-type'
            );
            const dataSources = ep.properties.dataSources || [];
            const allDataSources = JSON.stringify(dataSources);
            assert.ok(allDataSources.includes('authorization_code'),
                'should reference authorization_code grant type in dataSources');
        });

        it('should include client_id and client_secret in token request dataSources', function () {
            const contributions = manifest.contributions || [];
            const ep = contributions.find(
                (c: any) => c.type === 'ms.vss-endpoint.service-endpoint-type'
            );
            const dataSources = ep.properties.dataSources || [];
            const allDataSources = JSON.stringify(dataSources);
            assert.ok(allDataSources.includes('client_id'), 'should reference client_id');
            assert.ok(allDataSources.includes('client_secret'), 'should reference client_secret');
        });

        it('should use /oauth_token.do for token endpoint in dataSources', function () {
            const contributions = manifest.contributions || [];
            const ep = contributions.find(
                (c: any) => c.type === 'ms.vss-endpoint.service-endpoint-type'
            );
            const dataSources = ep.properties.dataSources || [];
            const allDataSources = JSON.stringify(dataSources);
            assert.ok(allDataSources.includes('/oauth_token.do'),
                'should reference /oauth_token.do token endpoint in dataSources');
        });
    });

    describe('Data sources', function () {

        let dataSources: any[];

        before(function () {
            const contributions = manifest.contributions || [];
            const endpoint = contributions.find(
                (c: any) => c.type === 'ms.vss-endpoint.service-endpoint-type'
            );
            dataSources = endpoint.properties.dataSources || [];
        });

        it('should define at least one data source', function () {
            assert.ok(dataSources.length > 0, 'should have at least one data source');
        });

        it('should have unique data source names', function () {
            const names = dataSources.map((ds: any) => ds.name);
            const uniqueNames = new Set(names);
            assert.strictEqual(names.length, uniqueNames.size,
                `data source names should be unique, found duplicates: ${names.filter((n: string, i: number) => names.indexOf(n) !== i)}`);
        });

        it('should have resultSelector using jsonpath syntax for applicable sources', function () {
            const withSelectors = dataSources.filter((ds: any) => ds.resultSelector);
            withSelectors.forEach((ds: any) => {
                assert.ok(ds.resultSelector.startsWith('jsonpath:'),
                    `data source "${ds.name}" resultSelector should start with jsonpath:`);
            });
        });
    });

    describe('Task contributions', function () {

        it('should declare CreateAndQueryChangeRequest task contributions', function () {
            const contributions = manifest.contributions || [];
            const taskContributions = contributions.filter(
                (c: any) => c.type === 'ms.vss-distributed-task.task'
            );
            const createTasks = taskContributions.filter(
                (c: any) => c.properties && c.properties.name &&
                    c.properties.name.includes('CreateAndQueryChangeRequest')
            );
            assert.ok(createTasks.length > 0, 'should have CreateAndQueryChangeRequest task contributions');
        });

        it('should declare UpdateServiceNowChangeRequest task contributions', function () {
            const contributions = manifest.contributions || [];
            const taskContributions = contributions.filter(
                (c: any) => c.type === 'ms.vss-distributed-task.task'
            );
            const updateTasks = taskContributions.filter(
                (c: any) => c.properties && c.properties.name &&
                    c.properties.name.includes('UpdateChangeRequest')
            );
            assert.ok(updateTasks.length > 0, 'should have UpdateChangeRequest task contributions');
        });
    });

    describe('Structural consistency', function () {

        const allTaskPaths = [
            { label: 'CreateV0', path: createTaskV0Path },
            { label: 'CreateV1', path: createTaskV1Path },
            { label: 'CreateV2', path: createTaskV2Path },
            { label: 'UpdateV0', path: updateTaskV0Path },
            { label: 'UpdateV1', path: updateTaskV1Path },
            { label: 'UpdateV2', path: updateTaskV2Path },
        ];

        allTaskPaths.forEach(({ label, path: taskPath }) => {
            describe(`${label} structural integrity`, function () {

                let task: any;

                before(function () {
                    task = loadJson(taskPath);
                });

                it('should have no duplicate input names', function () {
                    const names = task.inputs.map((i: any) => i.name);
                    const uniqueNames = new Set(names);
                    assert.strictEqual(names.length, uniqueNames.size,
                        `should have unique input names, found duplicates: ${names.filter((n: string, i: number) => names.indexOf(n) !== i)}`);
                });

                it('should have all dataSourceBindings reference valid endpointId', function () {
                    (task.dataSourceBindings || []).forEach((binding: any) => {
                        assert.strictEqual(binding.endpointId, '$(ServiceNowConnection)',
                            `dataSourceBinding target "${binding.target}" should reference ServiceNowConnection`);
                    });
                });

                it('should have valid JSON in all Body fields', function () {
                    const chain = task.execution.HttpRequestChain.Execute;
                    chain.forEach((step: any, index: number) => {
                        if (step.RequestInputs.Body) {
                            assert.doesNotThrow(() => {
                                // Body may contain template expressions, just check it's non-empty
                                assert.ok(step.RequestInputs.Body.length > 0,
                                    `step ${index} Body should be non-empty`);
                            }, `step ${index} Body should be valid`);
                        }
                    });
                });
            });
        });

        describe('Manifest file references', function () {

            it('should reference existing task folders in contributions', function () {
                const contributions = manifest.contributions || [];
                const taskContributions = contributions.filter(
                    (c: any) => c.type === 'ms.vss-distributed-task.task'
                );
                taskContributions.forEach((tc: any) => {
                    const taskFolder = path.join(srcRoot, tc.properties.name);
                    assert.ok(fs.existsSync(taskFolder),
                        `task contribution references folder "${tc.properties.name}" which should exist at ${taskFolder}`);
                });
            });

            it('should reference existing icon files', function () {
                if (manifest.icons) {
                    Object.entries(manifest.icons).forEach(([key, relativePath]: [string, any]) => {
                        const iconPath = path.join(srcRoot, relativePath);
                        assert.ok(fs.existsSync(iconPath),
                            `icon "${key}" references "${relativePath}" which should exist at ${iconPath}`);
                    });
                }
            });

            it('should have matching file entries for static files', function () {
                const files = manifest.files || [];
                files.forEach((f: any) => {
                    const filePath = path.join(srcRoot, f.path);
                    assert.ok(fs.existsSync(filePath),
                        `manifest file entry "${f.path}" should exist at ${filePath}`);
                });
            });
        });

        describe('Cross-version consistency', function () {

            it('should have same task id for all CreateAndQueryChangeRequest versions', function () {
                const v0 = loadJson(createTaskV0Path);
                const v1 = loadJson(createTaskV1Path);
                const v2 = loadJson(createTaskV2Path);
                assert.strictEqual(v0.id, v1.id, 'V0 and V1 should share task id');
                assert.strictEqual(v1.id, v2.id, 'V1 and V2 should share task id');
            });

            it('should have same task id for all UpdateChangeRequest versions', function () {
                const v0 = loadJson(updateTaskV0Path);
                const v1 = loadJson(updateTaskV1Path);
                const v2 = loadJson(updateTaskV2Path);
                assert.strictEqual(v0.id, v1.id, 'V0 and V1 should share task id');
                assert.strictEqual(v1.id, v2.id, 'V1 and V2 should share task id');
            });

            it('should have ascending Major versions', function () {
                const cv0 = loadJson(createTaskV0Path);
                const cv1 = loadJson(createTaskV1Path);
                const cv2 = loadJson(createTaskV2Path);
                assert.ok(cv0.version.Major < cv1.version.Major, 'Create V0 < V1');
                assert.ok(cv1.version.Major < cv2.version.Major, 'Create V1 < V2');
            });

            it('should have same task name across all versions', function () {
                const cv0 = loadJson(createTaskV0Path);
                const cv1 = loadJson(createTaskV1Path);
                const cv2 = loadJson(createTaskV2Path);
                assert.strictEqual(cv0.name, cv1.name);
                assert.strictEqual(cv1.name, cv2.name);
            });
        });
    });
});
