import * as path from 'path'

var mocha = require("mocha");
var mockery = require("mockery");
var stream = require("stream");

import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';

mockery.registerMock('fs', {
    createWriteStream: (a) => {
        var mockedStream = stream.Writable();
        mockedStream._write = () => { };
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

describe('filesystemProvider.putArtifactItem', () => {

    it('should not fail if artifactItem metadata is undefined', async (done) => {
        var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: undefined };
        var localFileProvider = new providers.FilesystemProvider("c:\\drop");
      
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

    it('should return items with updated paths', async (done) => {
        var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: null };
        var localFileProvider = new providers.FilesystemProvider("c:\\drop");

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
