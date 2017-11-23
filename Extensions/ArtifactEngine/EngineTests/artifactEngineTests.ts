var mocha = require("mocha");

import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';

describe('artifactEngine.processItems', () => {

    it('should call getRootItemsCalledCount for the given artifact provider', (done) => {
        var testProvider = new providers.StubProvider();

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
            .then(() => {
                assert.equal(testProvider.getRootItemsCalledCount, 1, `getRootItemsCalledCount: ${testProvider.getRootItemsCalledCount}`);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem for all artifact items', (done) => {
        var testProvider = new providers.StubProvider();

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 6);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItems for all artifact items of type folder', (done) => {
        var testProvider = new providers.StubProvider();

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
            .then(() => {
                assert.equal(testProvider.getArtifactItemsCalledCount, 2);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem only for artifact items that match the download pattern', (done) => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.ArtifactEngineOptions();
        downloadOptions.itemPattern = '@(PAth4|path5)\\**';

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, downloadOptions)
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 2);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should return items after processing', (done) => {
        var testProvider = new providers.StubProvider();

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, new engine.ArtifactEngineOptions())
            .then((items) => {
                assert.equal(items.length, 8);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem only for artifact items that match include pattern', (done) => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.ArtifactEngineOptions();
        downloadOptions.itemPattern = '"+path1\\**", "path3\\**" ,"-path4\\**"';

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, downloadOptions)
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 4);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem only for artifact items that match include pattern even with quotes', (done) => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.ArtifactEngineOptions();
        downloadOptions.itemPattern = '""+path1\\**"",""path3\\**"",""-path4\\**""';

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, downloadOptions)
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 4);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem for all artifact items if pattern is undefined', (done) => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.ArtifactEngineOptions();
        downloadOptions.itemPattern = null;

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, downloadOptions)
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 6);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem for all artifact items if ArtifactEngineOptions is undefined', (done) => {
        var testProvider = new providers.StubProvider();

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider)
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 6);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem only for included artifact items prefering exclude over include pattern', (done) => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.ArtifactEngineOptions();
        downloadOptions.itemPattern = '"+path1\\**","-path1\\path2\\**"';

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, downloadOptions)
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 2);
                done();
            }, (err) => {
                throw err;
            });
    });

    it('should call getArtifactItem only for included artifact items prefering include over exclude pattern', (done) => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.ArtifactEngineOptions();
        downloadOptions.itemPattern = '"-path1\\**", "+path1\\path2\\**"';

        new engine.ArtifactEngine()
            .processItems(testProvider, testProvider, downloadOptions)
            .then(() => {
                assert.equal(testProvider.getArtifactItemCalledCount, 1);
                done();
            }, (err) => {
                throw err;
            });
    });
});
