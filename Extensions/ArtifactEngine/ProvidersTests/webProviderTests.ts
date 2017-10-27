import * as assert from 'assert';
var http = require('http');

import * as engine from '../Engine';
import * as models from '../Models';
import * as providers from '../Providers';

import * as httpm from 'typed-rest-client/HttpClient';
import * as fs from 'fs';

var sinon = require('sinon');

var artifactItem;
var webProvider;
var getStub;
var stubResponse;

beforeEach((done) => {
    var handler = sinon.spy()
    webProvider = new providers.WebProvider("", "", {}, handler);

    stubResponse = new httpm.HttpClientResponse(null);
    sinon.stub(stubResponse, "readBody").returns("{}");
    stubResponse.message = sinon.spy(http.IncomingMessage);
    stubResponse.message.headers = {'content-encoding' : 'json'};
    getStub = sinon.stub(webProvider.httpc, 'get').returns(new Promise<httpm.HttpClientResponse>((resolve, reject) => {
        resolve(stubResponse);
    }));

    artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: null };
    artifactItem.metadata = { 'downloadUrl': 'http://stubUrl' };

    done();
});

describe('webProvider.getArtifactItems', () => {

    it('should call http get with correct url', async () => {
        var getArtifactItemPromise = webProvider.getArtifactItems(artifactItem);

        getArtifactItemPromise.then(() => {
            assert.equal(getStub.callCount, 1);
            assert.equal(getStub.args[0][0], "http://stubUrl");
        });
    });

    it('should replace double slashes from url', async () => {
        artifactItem.metadata = { 'downloadUrl': 'http://stubUrl//link' };
        
        var getArtifactItemPromise = webProvider.getArtifactItems(artifactItem);

        getArtifactItemPromise.then(() => {
            assert.equal(getStub.callCount, 1);
            assert.equal(getStub.args[0][0], "http://stubUrl/link");
        });
    });
});

describe('webProvider.getArtifactItem', () => {

    it('should call http get with correct url', async () => {
        var getArtifactItemPromise = webProvider.getArtifactItem(artifactItem);

        getArtifactItemPromise.then(() => {
            assert.equal(getStub.callCount, 1);
            assert.equal(getStub.args[0][0], "http://stubUrl");
        });
    });

    it('should replace double slashes from url', async () => {
        artifactItem.metadata = { 'downloadUrl': 'http://stubUrl//link' };
        
        var getArtifactItemPromise = webProvider.getArtifactItem(artifactItem);

        getArtifactItemPromise.then(() => {
            assert.equal(getStub.callCount, 1);
            assert.equal(getStub.args[0][0], "http://stubUrl/link");
        });
    });

    it('should Unzip on stream if content type is gzip', async () => {
        stubResponse.message.headers = {'content-encoding' : 'gzip'};
        stubResponse.message.pipe = sinon.spy();
        
        var getArtifactItemPromise = webProvider.getArtifactItem(artifactItem);

        getArtifactItemPromise.then(() => {
            assert.equal(stubResponse.message.pipe.callCount, 1);
            assert.equal(stubResponse.message.pipe.args[0][0].constructor.name, 'Unzip');
        });
    });
});