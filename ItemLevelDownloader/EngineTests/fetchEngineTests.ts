/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/modules/chai/index.d.ts" />

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

export class TestProvider extends providers.StubProvider {

    public getArtifactItemCalledCount = 0;
    public getArtifactItemsCalledCount = 0;

    async getArtifactItems(){
        this.getArtifactItemsCalledCount++;
        return super.getArtifactItems();
    }

    async getArtifactItem(artifactItem: models.ArtifactItem){
        this.getArtifactItemCalledCount++;
        return super.getArtifactItem(artifactItem);
    }
}
