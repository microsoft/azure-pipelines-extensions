import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';

describe('Unit Tests', () => {
    describe('artifactEngine tests', () => {

        it('processItems should call getRootItemsCalledCount for the given artifact provider', function (done) {
            // first test is timing out sometimes in cdp
            this.timeout(5000);
            var testProvider = new providers.StubProvider();

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
                .then(() => {
                    assert.strictEqual(testProvider.getRootItemsCalledCount, 1, `getRootItemsCalledCount: ${testProvider.getRootItemsCalledCount}`);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should call getArtifactItem for all artifact items', (done) => {
            var testProvider = new providers.StubProvider();

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 6);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should call getArtifactItems for all artifact items of type folder', (done) => {
            var testProvider = new providers.StubProvider();

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemsCalledCount, 2);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should call getArtifactItem only for artifact items that match the download pattern', (done) => {
            var testProvider = new providers.StubProvider();
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = '@(PAth4|path5)/**';

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, downloadOptions)
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 1);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        var runWindowsBasedTest = process.platform == 'win32' ? it : it.skip;
        runWindowsBasedTest('processItems should call getArtifactItem only for artifact items that match the download pattern', (done) => {
            var testProvider = new providers.StubProvider();
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = '@(PAth4|path5)\\**';

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, downloadOptions)
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 1);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should return items after processing', (done) => {
            var testProvider = new providers.StubProvider();

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
                .then((items) => {
                    assert.strictEqual(items.length, 8);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should call getArtifactItem only for artifact items that match include pattern', (done) => {
            var testProvider = new providers.StubProvider();
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = 'path1/**\npath3/**\n!path4/**';

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, downloadOptions)
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 4);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should call getArtifactItem for all artifact items if pattern is undefined', (done) => {
            var testProvider = new providers.StubProvider();
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = null;

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, downloadOptions)
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 6);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should call getArtifactItem for all artifact items if ArtifactEngineOptions is undefined', (done) => {
            var testProvider = new providers.StubProvider();

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider)
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 6);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should preserve case-sensitive matching and skip detection when the feature is disabled', async () => {
            var testProvider = new providers.StubProvider();
            var destinationProvider: models.IArtifactProvider = testProvider;
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = 'path1/**\n!PATH1/PATH2/**';
            var detectionCalled = false;
            destinationProvider.isCaseInsensitiveFilesystem = () => {
                detectionCalled = true;
                return true;
            };

            await withCaseInsensitiveArtifactMatchingFeature(false, async () => {
                await new engine.ArtifactEngine()
                    .processItems(testProvider, destinationProvider, downloadOptions);

                assert.strictEqual(testProvider.getArtifactItemCalledCount, 3);
                assert.strictEqual(detectionCalled, false);
            });
        });

        it('processItems should skip detection and preserve case-sensitive matching on Linux', async () => {
            var testProvider = new providers.StubProvider();
            var destinationProvider: models.IArtifactProvider = testProvider;
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = 'path1/**\n!PATH1/PATH2/**';
            var detectionCalled = false;
            destinationProvider.isCaseInsensitiveFilesystem = () => {
                detectionCalled = true;
                return true;
            };

            await withProcessPlatform('linux', async () => {
                await withCaseInsensitiveArtifactMatchingFeature(true, async () => {
                    await new engine.ArtifactEngine()
                        .processItems(testProvider, destinationProvider, downloadOptions);

                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 3);
                    assert.strictEqual(detectionCalled, false);
                });
            });
        });

        [
            { target: 'a case-insensitive Windows target', platform: 'win32' as NodeJS.Platform },
            { target: 'a case-insensitive macOS target', platform: 'darwin' as NodeJS.Platform }
        ].forEach(({ target, platform }) => {
            it(`processItems should match case-insensitively when the feature is enabled for ${target}`, async () => {
                await assertCaseInsensitiveMatching(true, platform);
            });
        });

        it('processItems should evaluate destination filesystem detection once for multiple matched items', async () => {
            var testProvider = new providers.StubProvider();
            var destinationProvider: models.IArtifactProvider = testProvider;
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = 'path1/**';
            var detectionCalledCount = 0;
            destinationProvider.isCaseInsensitiveFilesystem = () => {
                detectionCalledCount++;
                return true;
            };

            await withProcessPlatform('win32', async () => {
                await withCaseInsensitiveArtifactMatchingFeature(true, async () => {
                    await new engine.ArtifactEngine()
                        .processItems(testProvider, destinationProvider, downloadOptions);

                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 3);
                    assert.strictEqual(detectionCalledCount, 1);
                });
            });
        });

        [
            { target: 'a case-sensitive Linux target', platform: 'linux' as NodeJS.Platform },
            { target: 'a case-sensitive macOS target', platform: 'darwin' as NodeJS.Platform }
        ].forEach(({ target, platform }) => {
            it(`processItems should preserve case-sensitive matching when the feature is enabled for ${target}`, async () => {
                await assertCaseInsensitiveMatching(false, platform);
            });
        });

        it('processItems should preserve case-sensitive matching when filesystem detection fails', async () => {
            await assertCaseInsensitiveMatching(null, 'win32');
        });

        async function assertCaseInsensitiveMatching(
            isCaseInsensitive: boolean,
            platform: NodeJS.Platform): Promise<void> {
            var testProvider = new providers.StubProvider();
            var destinationProvider: models.IArtifactProvider = testProvider;
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = 'path1/**\n!PATH1/PATH2/**';
            destinationProvider.isCaseInsensitiveFilesystem = () => {
                if (isCaseInsensitive === null) {
                    throw new Error('Filesystem case detection is unavailable');
                }

                return isCaseInsensitive;
            };

            await withProcessPlatform(platform, async () => {
                await withCaseInsensitiveArtifactMatchingFeature(true, async () => {
                    await new engine.ArtifactEngine()
                        .processItems(testProvider, destinationProvider, downloadOptions);

                    assert.strictEqual(testProvider.getArtifactItemCalledCount, isCaseInsensitive ? 2 : 3);
                });
            });
        }

        async function withProcessPlatform(
            platform: NodeJS.Platform,
            operation: () => Promise<void>): Promise<void> {
            const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');
            if (!platformDescriptor) {
                throw new Error('Unable to save the process platform descriptor');
            }

            Object.defineProperty(process, 'platform', { value: platform });
            try {
                await operation();
            }
            finally {
                Object.defineProperty(process, 'platform', platformDescriptor);
            }
        }

        async function withCaseInsensitiveArtifactMatchingFeature(
            enabled: boolean,
            operation: () => Promise<void>): Promise<void> {
            const featureEnvironmentVariable =
                'DISTRIBUTEDTASK_TASKS_CASEINSENSITIVEARTIFACTMATCHINGFIXENABLED';
            const originalValue = process.env[featureEnvironmentVariable];
            if (enabled) {
                process.env[featureEnvironmentVariable] = 'true';
            }
            else {
                delete process.env[featureEnvironmentVariable];
            }

            try {
                await operation();
            }
            finally {
                if (originalValue === undefined) {
                    delete process.env[featureEnvironmentVariable];
                }
                else {
                    process.env[featureEnvironmentVariable] = originalValue;
                }
            }
        }

        it('processItems should call getArtifactItem only for included artifact items prefering exclude over include pattern', (done) => {
            var testProvider = new providers.StubProvider();
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = 'path1/**\n!path1/path2/**';

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, downloadOptions)
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 2);
                    done();
                }, (err) => {
                    throw err;
                });
        });

        it('processItems should call getArtifactItem only for included artifact items prefering include over exclude pattern', (done) => {
            var testProvider = new providers.StubProvider();
            var downloadOptions = new engine.ArtifactEngineOptions();
            downloadOptions.itemPattern = '!path1/**\npath1/path2/**';

            new engine.ArtifactEngine()
                .processItems(testProvider, testProvider, downloadOptions)
                .then(() => {
                    assert.strictEqual(testProvider.getArtifactItemCalledCount, 1);
                    done();
                }, (err) => {
                    throw err;
                });
        });
    });
});