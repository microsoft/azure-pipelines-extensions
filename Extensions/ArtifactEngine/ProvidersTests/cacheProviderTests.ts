var mock = require("mock-fs");
var mockery = require("mockery");
import * as assert from 'assert';

import * as models from '../Models';

mockery.registerMock('vsts-task-lib/task', {
    loc: (a) => {
        console.log(a)
    }
});
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

import * as providers from '../Providers';
import { ArtifactItemStore } from '../Store/artifactItemStore';

describe('Unit Tests', () => {
    describe('cacheProvider tests', () => {

        let localcacheProvider;

        before(() => {
            mock({
                "path/to/mock/cache": {
                    "ArtifactEngineCache": {
                        "04b481ae018b634ffcd860ef3f1de23bd529b559546dd2ae81ef3a7d4f18fe54": {
                            "file1.txt": "dummyContent",
                            "verify.json": "dummyContent",
                            "artifact-metadata.csv": "file1.txt,2a30c801a6c81f2eacaad6fc0bd3d1130af4e3a07d70146c46439a29a210f843"
                        }
                    }
                }
            });
            localcacheProvider = new providers.CacheProvider("path/to/mock/cache", "mock-key", "drop");
            localcacheProvider.artifactItemStore = new ArtifactItemStore();
        });

        it('makeOldHash should make the oldFileHashMap correctly', async (done) => {
           assert.equal(localcacheProvider.oldFileHashMap["file1.txt"], "2a30c801a6c81f2eacaad6fc0bd3d1130af4e3a07d70146c46439a29a210f843");
           done()
        });
        
        it('getArtifactItem should return the appropriate stream for file present in cache', async (done) => {
            var artifactItem1 = { fileLength: 0, itemType: models.ItemType.File, path: "drop\\file1.txt", lastModified: null, metadata: undefined, fileHashInArtifactMetadata:"2a30c801a6c81f2eacaad6fc0bd3d1130af4e3a07d70146c46439a29a210f843" };
            var artifactItem2 = { fileLength: 0, itemType: models.ItemType.File, path: "drop\\file2.txt", lastModified: null, metadata: undefined, fileHashInArtifactMetadata:"2a30c801a6c81f2eacaad6fc0bd3d1130af4e3a07d70146c46439a29a210f843" };
            localcacheProvider.getArtifactItem(artifactItem1).then((contentStream) => {
                assert.notEqual(contentStream,undefined);
                done();
            }, (err) => {
                throw err
            });
            localcacheProvider.getArtifactItem(artifactItem2).then((contentStream) => {
                assert.equal(contentStream,undefined);
            }, (err) => {
                throw err;
            });
        });

        after(() => {
            mock.restore();
            mockery.deregisterAll();
            mockery.disable();
        });
    });
});