import * as path from 'path'

var libMocker = require("azure-pipelines-task-lib/lib-mocker");
var stream = require("stream");
var sinon = require("sinon");

import * as assert from 'assert';

import * as models from '../Models';

var createWriteStreamSpy = sinon.spy((filePath) => {
    var mockedStream = stream.Writable();
    mockedStream._write = (data, encoding, callback) => { callback(); };
    return mockedStream;
});

libMocker.registerMock('fs', {
    statSync: () => {
        return {
            isDirectory: () => true
        }
    },
    createWriteStream: createWriteStreamSpy,
    existsSync: () => true,
    readFile: (filename, encoding, callback) => {
        callback(undefined, "{}");
    },
    writeFileSync: () => { }
});
libMocker.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

import * as providers from '../Providers';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import * as filesystemCaseSensitivity from '../Providers/filesystemCaseSensitivity';
var tl = require("azure-pipelines-task-lib");

describe('Unit Tests', () => {
    describe('filesystemProvider tests', () => {

        let localFileProvider;
        let stub;

        before(() => {
            tl.setResourcePath(path.join(__dirname, '..', 'lib.json'));
            process.env['DISTRIBUTEDTASK_TASKS_ENABLEARTIFACTENGINEPATHVALIDATION'] = 'true';
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
                assert.strictEqual(processedItem.metadata[models.Constants.DestinationUrlKey], path.join("c:\\drop", "path1\\file1"));
                done();
            }, (err) => {
                throw err;
            });
        });

        it('isCaseInsensitiveFilesystem should detect only the destination root once', () => {
            const caseDetectionStub = sinon.stub(filesystemCaseSensitivity, 'isFilesystemCaseInsensitive').returns(true);
            const provider = new providers.FilesystemProvider('c:\\drop');

            try {
                assert.strictEqual(provider.isCaseInsensitiveFilesystem(), true);
                assert.strictEqual(provider.isCaseInsensitiveFilesystem(), true);
                assert.strictEqual(caseDetectionStub.calledOnce, true);
                assert.deepStrictEqual(caseDetectionStub.firstCall.args, ['c:\\drop']);
            }
            finally {
                caseDetectionStub.restore();
            }
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

        function makeReadable(content) {
            const s = new stream.Readable();
            s._read = () => { };
            s.push(content);
            s.push(null);
            return s;
        }

        // 1. Parent-relative paths (POSIX separators) are rejected on every platform.
        it('putArtifactItem should reject parent-relative paths on all platforms', () => {
            const outOfRootPaths = ['../outside.txt', 'folder/../../outside.txt', 'a/b/../../../outside.txt'];

            return Promise.all(outOfRootPaths.map((itemPath) => {
                const artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: itemPath, contentType: undefined, lastModified: null, metadata: null };
                return assert.rejects(
                    localFileProvider.putArtifactItem(artifactItem, null),
                    /outside the download directory/);
            }));
        });

        // 1. A backslash is a separator only on Windows, so these reject only there.
        it('putArtifactItem should reject backslash parent-relative paths on win32', function () {
            if (process.platform !== 'win32') { this.skip(); }
            const outOfRootPaths = ['..\\outside.txt', 'folder\\..\\..\\outside.txt'];

            return Promise.all(outOfRootPaths.map((itemPath) => {
                const artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: itemPath, contentType: undefined, lastModified: null, metadata: null };
                return assert.rejects(
                    localFileProvider.putArtifactItem(artifactItem, null),
                    /outside the download directory/);
            }));
        });

        // 2. Native absolute item paths point outside the root and must reject.
        it('putArtifactItem should reject native absolute item paths', function () {
            const absolutePaths = process.platform === 'win32'
                ? ['C:\\outside.txt', '\\\\server\\share\\x']
                : ['/outside.txt'];

            return Promise.all(absolutePaths.map((itemPath) => {
                const artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: itemPath, contentType: undefined, lastModified: null, metadata: null };
                return assert.rejects(
                    localFileProvider.putArtifactItem(artifactItem, null),
                    /outside the download directory/);
            }));
        });

        // 3. A sibling directory that only shares the root's name prefix is still outside the root.
        it('putArtifactItem should reject a sibling directory sharing the root name prefix', () => {
            const siblingProvider = new providers.FilesystemProvider("drop");
            siblingProvider.artifactItemStore = new ArtifactItemStore();
            const artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: '../drop2/other.txt', contentType: undefined, lastModified: null, metadata: null };

            return assert.rejects(
                siblingProvider.putArtifactItem(artifactItem, null),
                /outside the download directory/);
        });

        // 4. On POSIX a backslash is a legal filename character, so '..\\..\\outside.txt' is a
        //    SINGLE filename that stays inside the root. This proves the validation relies on
        //    native path semantics instead of folding '\\' into '/'.
        it('putArtifactItem should treat a literal-backslash name as one in-root file on POSIX', function () {
            if (process.platform === 'win32') { this.skip(); }

            const root = '/drop';
            const posixProvider = new providers.FilesystemProvider(root);
            posixProvider.artifactItemStore = new ArtifactItemStore();
            const itemPath = '..\\..\\outside.txt';
            const expected = path.resolve(root, itemPath);
            const artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: itemPath, contentType: undefined, lastModified: null, metadata: null };

            return posixProvider.putArtifactItem(artifactItem, makeReadable('stub content')).then((processedItem) => {
                assert.strictEqual(createWriteStreamSpy.lastCall.args[0], expected, `createWriteStream should receive ${expected}`);
                assert(expected.startsWith(path.resolve(root)), 'resolved target must stay within the root');
                assert.strictEqual(processedItem.metadata[models.Constants.DestinationUrlKey], expected);
            });
        });

        // 5. Both the File and Folder branches must reject an out-of-root path.
        it('putArtifactItem should reject an out-of-root path for both File and Folder items', () => {
            const fileItem = { fileLength: 0, itemType: models.ItemType.File, path: '../outside.txt', contentType: undefined, lastModified: null, metadata: null };
            const folderItem = { fileLength: 0, itemType: models.ItemType.Folder, path: '../outside', contentType: undefined, lastModified: null, metadata: null };

            return Promise.all([
                assert.rejects(localFileProvider.putArtifactItem(fileItem, null), /outside the download directory/),
                assert.rejects(localFileProvider.putArtifactItem(folderItem, null), /outside the download directory/)
            ]);
        });

        // 6. Rejection must happen before any filesystem side effect (no mkdirP, no write stream).
        it('putArtifactItem should not mkdir or open a write stream for rejected paths', async () => {
            const writeCallsBefore = createWriteStreamSpy.callCount;
            stub.resetHistory();

            const fileItem = { fileLength: 0, itemType: models.ItemType.File, path: '../outside.txt', contentType: undefined, lastModified: null, metadata: null };
            await assert.rejects(localFileProvider.putArtifactItem(fileItem, null), /outside the download directory/);

            const folderItem = { fileLength: 0, itemType: models.ItemType.Folder, path: '../outside', contentType: undefined, lastModified: null, metadata: null };
            await assert.rejects(localFileProvider.putArtifactItem(folderItem, null), /outside the download directory/);

            assert(stub.notCalled, 'mkdirP must not run for rejected paths');
            assert.strictEqual(createWriteStreamSpy.callCount, writeCallsBefore, 'createWriteStream must not run for rejected paths');
        });

        // 7. Paths that resolve to the root itself (relative === '') are allowed.
        it('putArtifactItem should allow folder items that resolve to the root itself', () => {
            stub.resetHistory();
            const resolvedRoot = path.resolve("c:\\drop");

            return Promise.all(['', '.'].map((itemPath) => {
                const artifactItem = { fileLength: 0, itemType: models.ItemType.Folder, path: itemPath, contentType: undefined, lastModified: null, metadata: null };
                return localFileProvider.putArtifactItem(artifactItem, null).then((processedItem) => {
                    assert.strictEqual(processedItem, artifactItem);
                    assert(stub.calledWith(resolvedRoot), `mkdirP should be called with ${resolvedRoot}`);
                });
            }));
        });

        // 8. A valid nested file must be written to the exact validated (resolved) path. This would
        //    fail against the old bug where the validated path and the written path diverged.
        it('putArtifactItem should write a nested file to the validated resolved path', () => {
            const itemPath = 'drop/sub/file.txt';
            const expected = path.resolve("c:\\drop", itemPath);
            const artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: itemPath, contentType: undefined, lastModified: null, metadata: null };

            return localFileProvider.putArtifactItem(artifactItem, makeReadable('stub content')).then((processedItem) => {
                assert.strictEqual(createWriteStreamSpy.lastCall.args[0], expected, `createWriteStream should receive ${expected}`);
                assert.strictEqual(processedItem.metadata[models.Constants.DestinationUrlKey], expected);
            });
        });

        // Feature off: the gate preserves the original path composition (no validation).
        it('putArtifactItem should preserve original path composition when the feature is disabled', () => {
            const ffKey = 'DISTRIBUTEDTASK_TASKS_ENABLEARTIFACTENGINEPATHVALIDATION';
            const previous = process.env[ffKey];
            delete process.env[ffKey];
            const restore = () => { if (previous === undefined) { delete process.env[ffKey]; } else { process.env[ffKey] = previous; } };

            const itemPath = '../outside.txt';
            const artifactItem = { fileLength: 0, itemType: models.ItemType.File, path: itemPath, contentType: undefined, lastModified: null, metadata: null };

            return localFileProvider.putArtifactItem(artifactItem, makeReadable('stub content'))
                .then((processedItem) => {
                    assert.strictEqual(processedItem.metadata[models.Constants.DestinationUrlKey], path.join("c:\\drop", itemPath));
                })
                .finally(restore);
        });

        after(() => {
            tl.mkdirP.restore();
            libMocker.deregisterAll();
            delete process.env['DISTRIBUTEDTASK_TASKS_ENABLEARTIFACTENGINEPATHVALIDATION'];
            // Do NOT call libMocker.disable() here. The artifact-engine pipeline
            // started by other tests in this suite is still running asynchronously
            // when this `after` hook fires; its later call to tl.loc() goes
            // through the hooked loader and throws "Loader has not been hooked"
            // if we un-hook it now. deregisterAll() removes our mocks, which is
            // the only teardown we actually need across suites.
            // libMocker.disable();
        });
    });
});