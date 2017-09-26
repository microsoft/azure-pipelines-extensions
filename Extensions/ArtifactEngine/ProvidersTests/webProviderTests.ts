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

mockery.registerMock('typed-rest-client/HttpClient', {
    get: (a) => {
        console.log(a);
    },
    constructor: (userAgent, handlers?, requestOptions?) => {
        console.log("---------------->");
    }
});

var path = require('path');
var stream = require("stream");

import * as assert from 'assert';

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';
import * as httpm from 'typed-rest-client/HttpClient';
import { BasicCredentialHandler } from "../Providers/handlers/basiccreds";

describe('webProvider.getArtifactItem', () => {

    it('should reject if no downloadUrl is available', async () => {
        var promise = new Promise((resolve, reject) => {
            var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: undefined };
            var webProvider = new providers.WebProvider("http://dummyartifact.com", "dummyTemplate.handlebar", {}, new BasicCredentialHandler("", ""));
            
            var stream = webProvider.getArtifactItem(artifactItem);
    
            stream.then(() => {
                reject();
            }).catch((reason) => {
                assert.equal(reason, "No downloadUrl available to download the item.");
                resolve();
            });
        });

        return promise;
    });

    it('should catch failed responses', async () => {
        var promise = new Promise((resolve, reject) => {
            var artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: null };
            artifactItem.metadata = {};
            artifactItem.metadata["downloadUrl"] = "http://dummyartifact.com";
            var webProvider = new providers.WebProvider("http://dummyartifact.com", "dummyTemplate.handlebar", {}, new BasicCredentialHandler("", ""));
            
            var stream = webProvider.getArtifactItem(artifactItem);

            stream.then(() => {
                reject();
            }).catch((reason) => {
                resolve();
            });
        });

        return promise;
    });

    after(() => {
        mockery.disable();
    });
});
