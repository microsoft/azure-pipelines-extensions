var libMocker = require("azure-pipelines-task-lib/lib-mocker");
var stream = require("stream");
// `node:fs` bypasses any mocks registered for the plain `fs` key, so this
// reference is guaranteed to be the real fs even if other test files have
// already enabled the mocker.
var realFs = require("node:fs");

import * as assert from 'assert';

import * as httpm from '../Providers/typed-rest-client/HttpClient';
import * as models from '../Models';
libMocker.registerMock('fs', {
    statSync: () => {
        return {
            isDirectory: () => true
        }
    },
    createWriteStream: (a) => {
        var mockedStream = stream.Writable();
        mockedStream._write = () => { };
        return mockedStream;
    },
    existsSync: () => true,
    readFile: (filename, encoding, callback) => {
        // If the consumer is a webProvider unit test (no real template path),
        // return an empty JSON array so the promise resolves. Otherwise
        // delegate to the real fs so integration tests that rely on actual
        // handlebars templates still work, even when this mock leaks past
        // `disable()` via cached modules.
        if (typeof filename === 'string' && filename && realFs.existsSync(filename) && realFs.statSync(filename).isFile()) {
            realFs.readFile(filename, encoding, callback);
            return;
        }
        callback(undefined, "[]");
    }
});
libMocker.enable({
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

    artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: "path1\\file1", lastModified: null, contentType: undefined, metadata: null };
    artifactItem.metadata = { 'downloadUrl': 'http://stubUrl' };

    done();
});
describe('Unit Tests', () => {
    describe('webProvider tests', () => {

        it('getArtifactItems should call http get with correct url', (done) => {
            var getArtifactItemPromise = webProvider.getArtifactItems(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.strictEqual(getStub.callCount, 1);
                assert.strictEqual(getStub.args[0][0], "http://stubUrl");
                done();
            }, (err) => {
                throw err;
            });
        });

        it('getArtifactItems should replace double slashes from url', (done) => {
            artifactItem.metadata = { 'downloadUrl': 'http://stubUrl//link' };

            var getArtifactItemPromise = webProvider.getArtifactItems(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.strictEqual(getStub.callCount, 1);
                assert.strictEqual(getStub.args[0][0], "http://stubUrl/link");
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
                assert.strictEqual(getStub.callCount, 1);
                assert.strictEqual(getStub.args[0][0], "http://stubUrl");
                done();
            }, (err) => {
                throw err;
            });
        });

        it('getArtifactItem should replace double slashes from url', (done) => {
            artifactItem.metadata = { 'downloadUrl': 'http://stubUrl//link' };

            var getArtifactItemPromise = webProvider.getArtifactItem(artifactItem);

            getArtifactItemPromise.then(() => {
                assert.strictEqual(getStub.callCount, 1);
                assert.strictEqual(getStub.args[0][0], "http://stubUrl/link");
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
                assert.strictEqual(stubResponse.message.pipe.callCount, 1);
                assert.strictEqual(stubResponse.message.pipe.args[0][0].constructor.name, 'Unzip');
                done();
            }, (err) => {
                throw err;
            });
        });
    });
});
// some bug in libMocker, need to see how to disable
after(() => {
    libMocker.deregisterAll();
    // Do NOT call libMocker.disable() here. The artifact-engine pipeline
    // started by other tests in this suite is still running asynchronously
    // when this `after` hook fires; its later call to tl.loc() goes
    // through the hooked loader and throws "Loader has not been hooked"
    // if we un-hook it now. deregisterAll() removes our mocks, which is
    // the only teardown we actually need across suites.
    // libMocker.disable();
});
