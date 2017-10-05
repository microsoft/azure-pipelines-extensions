var mocha = require("mocha");
var mockery = require("mockery")

mockery.enable({
    warnOnReplace: false,
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

var path = require('path');
var stream = require("stream");

import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';

describe('filesystemProvider.putArtifactItem', () => {

    it('should not fail if artifactItem metadata is undefined', async () => {
        var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: undefined };
        var localFileProvider = new providers.FilesystemProvider("c:\\drop");
      
        const s = new stream.Readable();
        s._read = () => { };
        s.push(`stub content`);
        s.push(null);

        var processedItem = await localFileProvider.putArtifactItem(artifactItem, s);
    });

    it('should return items with updated paths', async () => {
        var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: null };
        var localFileProvider = new providers.FilesystemProvider("c:\\drop");

        const s = new stream.Readable();
        s._read = () => { };
        s.push(`stub content`);
        s.push(null);
        
        var processedItem = await localFileProvider.putArtifactItem(artifactItem , s);

        assert.equal(processedItem.metadata[models.Constants.DestinationUrlKey], path.join("c:\\drop", "path1\\file1"));
    });
    
    

    after(() => {
        mockery.disable();
    });
});
