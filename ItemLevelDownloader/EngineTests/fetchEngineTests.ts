import * as mocha from "mocha";
import * as assert from "assert"

import * as engine from "../Engine"
import * as models from "../Models"
import * as providers from "../Providers"

describe('fetchItems', () => {
    it('should call getArtifactItems for the given artifact provider', async () => {
        var testProvider = new TestProvider();

        await new engine.FetchEngine().fetchItems(testProvider, "c:\\drop", new engine.FetchEngineOptions());

        assert.equal(testProvider.getArtifactItemsCalledCount, 1);
    });
});

describe('fetchItems', () => {
    it('should call getArtifactItem for all artifact items', async () => {
        var testProvider = new TestProvider();

        await (new engine.FetchEngine().fetchItems(testProvider, "c:\\drop", new engine.FetchEngineOptions()));

        assert.equal(testProvider.getArtifactItemCalledCount, 5);
    });
});

describe('fetchItems', () => {
    it('should call getArtifactItem only for artifact that match the download pattern', async () => {
        var testProvider = new TestProvider();
        var downloadOptions = new engine.FetchEngineOptions();
        downloadOptions.downloadPattern = '*path{4,5}\\**';

        await new engine.FetchEngine().fetchItems(testProvider, "c:\\drop", downloadOptions);

        assert.equal(testProvider.getArtifactItemCalledCount, 2);
    });
});

export class TestProvider extends providers.StubProvider {

    public getArtifactItemCalledCount = 0;
    public getArtifactItemsCalledCount = 0;

    public itemsDownloaded: models.ArtifactItem[] = [];

    async getArtifactItems(){
        this.getArtifactItemsCalledCount++;
        return super.getArtifactItems();
    }

    async getArtifactItem(artifactItem: models.ArtifactItem){
        this.getArtifactItemCalledCount++;
        this.itemsDownloaded.push(artifactItem);
        return super.getArtifactItem(artifactItem);
    }
}
