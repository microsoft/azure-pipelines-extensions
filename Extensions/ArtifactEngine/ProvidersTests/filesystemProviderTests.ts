import * as path from 'path'

var mockery = require("mockery");
var stream = require("stream");
var sinon = require("sinon");

import * as assert from 'assert';

import * as models from '../Models';

mockery.registerMock('fs', {
    statSync: () => {
        return {
            isDirectory: () => true
        }
    },
    createWriteStream: (a) => {
        var mockedStream = stream.Writable();
        mockedStream._write = (data, encoding, callback) => { callback(); };
        return mockedStream;
    },
    existsSync: () => true,
    readFile: (filename, encoding, callback) => {
        callback(undefined, "{}");
    }
});
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

import * as providers from '../Providers';
import { ArtifactItemStore } from '../Store/artifactItemStore';
var tl = require("vsts-task-lib");

describe('Unit Tests', () => {
    describe('filesystemProvider tests', () => {

        let localFileProvider;
        let stub;

        before(() => {
            stub = sinon.stub(tl, "mkdirP");

            localFileProvider = new providers.FilesystemProvider("c:\\drop");
            localFileProvider.artifactItemStore = new ArtifactItemStore();
        });

        it('putArtifactItem should not fail if artifactItem metadata is undefined', (done) => {
            var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: undefined };

            const s = new stream.Readable();
            s._read = () => { };
            s.push(`stub content`);
            s.push(null);

            localFileProvider.putArtifactItem(artifactItem, s).then((processedItem) => {
                done();
            }, (err) => {
                throw err;
            });
        });

        it('putArtifactItem should return items with updated paths', (done) => {
            var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: null };

            const s = new stream.Readable();
            s._read = () => { };
            s.push(`stub content`);
            s.push(null);

            localFileProvider.putArtifactItem(artifactItem, s).then((processedItem) => {
                assert.equal(processedItem.metadata[models.Constants.DestinationUrlKey], path.join("c:\\drop", "path1\\file1"));
                done();
            }, (err) => {
                throw err;
            });
        });

        it('putArtifactItem should also create empty folders', (done) => {
            var artifactItem = { fileLength: 0, itemType: models.ItemType.Folder, path: "path1\\folder1", lastModified: null, metadata: null };

            localFileProvider.putArtifactItem(artifactItem, null).then((processedItem) => {
                assert(stub.calledWith(path.join("c:\\drop", "path1\\folder1")));
                done();
            }, (err) => {
                throw err;
            });
        });

        after(() => {
            tl.mkdirP.restore();
            mockery.deregisterAll();
            mockery.disable();
        });
    });
});