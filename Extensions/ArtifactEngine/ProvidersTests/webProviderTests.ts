var mockery = require("mockery");
var stream = require("stream");

import * as assert from 'assert';

import * as httpm from '../Providers/typed-rest-client/HttpClient';
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

var sinon = require('sinon');

var artifactItem: models.ArtifactItem;
var webProvider: providers.WebProvider;
var getStub;
var stubResponse;

beforeEach((done) => {
    var handler = sinon.spy()
    webProvider = new providers.WebProvider("", "", {}, handler);

    stubResponse = new httpm.HttpClientResponse(null);
    sinon.stub(stubResponse, "readBody").returns(new Promise((resolve, reject) => { resolve("{}") }));
    stubResponse.message = { headers: { 'content-encoding': 'json' }, on: (a, b) => { } };
    getStub = sinon.stub(webProvider.webClient, 'get').returns(new Promise<httpm.HttpClientResponse>((resolve, reject) => {
        resolve(stubResponse);
    }));

    artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, metadata: null };
    artifactItem.metadata = { 'downloadUrl': 'http://stubUrl' };

    done();
});
describe('Unit Tests', () => {
    describe('webProvider tests', () => {

        it('getArtifactItems should call http get with correct url', (done) => {
            var getArtifactItemPromise = webProvider.getArtifactItems(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.equal(getStub.callCount, 1);
                assert.equal(getStub.args[0][0], "http://stubUrl");
                done();
            }, (err) => {
                throw err;
            });
        });

        it('getArtifactItems should replace double slashes from url', (done) => {
            artifactItem.metadata = { 'downloadUrl': 'http://stubUrl//link' };

            var getArtifactItemPromise = webProvider.getArtifactItems(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.equal(getStub.callCount, 1);
                assert.equal(getStub.args[0][0], "http://stubUrl/link");
                done();
            }, (err) => {
                throw err;
            });
        });
    });

    describe('webProvider tests', () => {

        it('getArtifactItem should call http get with correct url', (done) => {
            var getArtifactItemPromise = webProvider.getArtifactItem(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.equal(getStub.callCount, 1);
                assert.equal(getStub.args[0][0], "http://stubUrl");
                done();
            }, (err) => {
                throw err;
            });
        });

        it('getArtifactItem should replace double slashes from url', (done) => {
            artifactItem.metadata = { 'downloadUrl': 'http://stubUrl//link' };

            var getArtifactItemPromise = webProvider.getArtifactItem(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.equal(getStub.callCount, 1);
                assert.equal(getStub.args[0][0], "http://stubUrl/link");
                done();
            }, (err) => {
                throw err;
            });
        });

        it('getArtifactItem should Unzip on stream if content type is gzip', (done) => {
            stubResponse.message.headers = { 'content-encoding': 'gzip' };
            stubResponse.message.pipe = sinon.spy();

            var getArtifactItemPromise = webProvider.getArtifactItem(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.equal(stubResponse.message.pipe.callCount, 1);
                assert.equal(stubResponse.message.pipe.args[0][0].constructor.name, 'Unzip');
                done();
            }, (err) => {
                throw err;
            });
        });
    });
});
// some bug in mockery, need to see how to disable
after(() => {
    mockery.deregisterAll();
    //mockery.disable();
});
