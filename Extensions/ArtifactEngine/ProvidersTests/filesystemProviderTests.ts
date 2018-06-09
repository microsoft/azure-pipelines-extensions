import * as path from 'path'

var mockery = require("mockery");
var stream = require("stream");

import * as assert from 'assert';

import * as models from '../Models';

mockery.registerMock('fs', {
    statSync: () => {
        return {
            isDirectory : () => true
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

describe('filesystemProvider tests', () => {

    let localFileProvider;

    before(() => {
        localFileProvider = new providers.FilesystemProvider("c:\\drop");
        localFileProvider.artifactItemStore = new ArtifactItemStore();
    });

    it('putArtifactItem should not fail if artifactItem metadata is undefined', async (done) => {
        var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: undefined };
      
        const s = new stream.Readable();
        s._read = () => { };
        s.push(`stub content`);
        s.push(null);

        localFileProvider.putArtifactItem(artifactItem, s).then((processedItem) => {
            done();
        }, (err) => {
            throw err
        });
    });

    it('putArtifactItem should return items with updated paths', async (done) => {
        var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: null };

        const s = new stream.Readable();
        s._read = () => { };
        s.push(`stub content`);
        s.push(null);
        
        localFileProvider.putArtifactItem(artifactItem , s).then((processedItem) => {
            assert.equal(processedItem.metadata[models.Constants.DestinationUrlKey], path.join("c:\\drop", "path1\\file1"));
            done();
        }, (err) => {
            throw err
        });
    });

    after(() => {
        mockery.deregisterAll();
        mockery.disable();
    });
});
