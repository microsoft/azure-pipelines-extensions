import * as mocha from 'mocha';
import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';
import { ArtifactItemStore } from '../Store/artifactItemStore';

describe('artifactItemStore.add', () => {
    it('should add artifact item to the artifact store', () => {
        var artifactItemStore = new ArtifactItemStore();

        artifactItemStore.add(new models.ArtifactItem());

        assert.equal(artifactItemStore.size(), 1);
    });
});

describe('artifactItemStore.add', () => {
    it('should not re-add same artifact item to the artifact store', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";

        artifactItemStore.add(artifactItem);
        artifactItemStore.add(artifactItem);

        assert.equal(artifactItemStore.size(), 1);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should return artifact item to be processed', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem = new models.ArtifactItem();
        artifactItem.path = "path1";

        artifactItemStore.add(artifactItem);

        assert.equal(artifactItemStore.getNextItemToProcess().path, artifactItem.path);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should not throw if no items have been added to store', () => {
        var artifactItemStore = new ArtifactItemStore();

        artifactItemStore.getNextItemToProcess();

        assert.equal(artifactItemStore.getNextItemToProcess(), undefined);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should not return already processing item', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        var artifactItem2 = new models.ArtifactItem();
        artifactItem2.path = "path2";
        artifactItemStore.add(artifactItem1);
        artifactItemStore.add(artifactItem2);

        artifactItemStore.getNextItemToProcess();

        assert.equal(artifactItemStore.getNextItemToProcess().path, artifactItem2.path);
    });
});

describe('artifactItemStore.getNextItemToProcess', () => {
    it('should return undefined if there are no more items to process', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.add(artifactItem1);

        artifactItemStore.getNextItemToProcess();

        assert.equal(artifactItemStore.getNextItemToProcess(), undefined);
    });
});

describe('artifactItemStore.markAsProcessed', () => {
    it('should remove the artifactItem from queue', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";
        artifactItemStore.add(artifactItem1);

        artifactItemStore.markAsProcessed(artifactItem1);

        assert.equal(artifactItemStore.getNextItemToProcess(), undefined);
    });
});

describe('artifactItemStore.markAsProcessed', () => {
    it('should not throw if the artifactItem does not exisit in store', () => {
        var artifactItemStore = new ArtifactItemStore();
        var artifactItem1 = new models.ArtifactItem();
        artifactItem1.path = "path1";

        artifactItemStore.markAsProcessed(artifactItem1);
    });
});

