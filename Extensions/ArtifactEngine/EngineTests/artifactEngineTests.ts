var path = require('path');
var stream = require("stream")
var mocha = require("mocha");
var mockery = require("mockery")

mockery.enable({
    warnOnReplace: true,
    warnOnUnregistered: false
});

mockery.registerMock('fs', {
    createWriteStream: (a) => {
        var mockedStream = stream.Writable();
        mockedStream._write = () => { };
        return mockedStream;
    },
    existsSync: () => true
});

import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';

describe('artifactEngine.processItems', () => {

    it('should call getRootItemsCalledCount for the given artifact provider', async () => {
        var testProvider = new providers.StubProvider();

        await new engine.ArtifactEngine().processItems(testProvider, testProvider, new engine.ArtifactEngineOptions());

        assert.equal(testProvider.getRootItemsCalledCount, 1, "test:" + testProvider.getRootItemsCalledCount);
    });

    it('should call getArtifactItem for all artifact items', async () => {
        var testProvider = new providers.StubProvider();

        await new engine.ArtifactEngine().processItems(testProvider, testProvider, new engine.ArtifactEngineOptions());

        assert.equal(testProvider.getArtifactItemCalledCount, 4);
    });

    it('should call getArtifactItems for all artifact items of type folder', async () => {
        var testProvider = new providers.StubProvider();

        await new engine.ArtifactEngine().processItems(testProvider, testProvider, new engine.ArtifactEngineOptions());

        assert.equal(testProvider.getArtifactItemsCalledCount, 2);
    });

    it('should call getArtifactItem only for artifact that match the download pattern', async () => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.ArtifactEngineOptions();
        downloadOptions.itemPattern = '@(PAth4|path5)\\**';

        await new engine.ArtifactEngine().processItems(testProvider, testProvider, downloadOptions);

        assert.equal(testProvider.getArtifactItemCalledCount, 2);
    });

    it('should return items after processing', async () => {
        var testProvider = new providers.StubProvider();

        var items = await new engine.ArtifactEngine().processItems(testProvider, testProvider, new engine.ArtifactEngineOptions());

        assert.equal(items.length, 6);
    });
});
