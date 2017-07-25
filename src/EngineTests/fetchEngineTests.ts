import * as mocha from "mocha";
import * as assert from "assert"

import * as engine from "../Engine"
import * as models from "../Models"
import * as providers from "../Providers"

describe('fetchEngine.fetchItems', () => {
    it('should call getRootItemsCalledCount for the given artifact provider', async () => {
        var testProvider = new providers.StubProvider();

        await new engine.FetchEngine().fetchItems(testProvider, "c:\\drop", new engine.FetchEngineOptions());

        assert.equal(testProvider.getRootItemsCalledCount, 1);
    });
});

describe('fetchEngine.fetchItems', () => {
    it('should call getArtifactItem for all artifact items', async () => {
        var testProvider = new providers.StubProvider();

        await (new engine.FetchEngine().fetchItems(testProvider, "c:\\drop", new engine.FetchEngineOptions()));

        assert.equal(testProvider.getArtifactItemCalledCount, 4);
    });
});

describe('fetchEngine.fetchItems', () => {
    it('should call getArtifactItems for all artifact items of type folder', async () => {
        var testProvider = new providers.StubProvider();

        await (new engine.FetchEngine().fetchItems(testProvider, "c:\\drop", new engine.FetchEngineOptions()));

        assert.equal(testProvider.getArtifactItemsCalledCount, 2);
    });
});

describe('fetchEngine.fetchItems', () => {
    it('should call getArtifactItem only for artifact that match the download pattern', async () => {
        var testProvider = new providers.StubProvider();
        var downloadOptions = new engine.FetchEngineOptions();
        downloadOptions.downloadPattern = '*path{4,5}\\**';

        await new engine.FetchEngine().fetchItems(testProvider, "c:\\drop", downloadOptions);

        assert.equal(testProvider.getArtifactItemCalledCount, 2);
    });
});
