import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';

import * as sinon from 'sinon';
import * as tl from 'azure-pipelines-task-lib/task';

import { ArtifactEngine, ArtifactEngineOptions } from '../Engine';
import * as models from '../Models';
import { FilesystemProvider } from '../Providers/filesystemProvider';
import { ArtifactItemStore } from '../Store/artifactItemStore';

const featureVariable = 'DISTRIBUTEDTASK_TASKS_ENABLEARTIFACTENGINEPATHVALIDATION';

function makeTempRoot(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function readStreamOf(content: string): NodeJS.ReadableStream {
    const s = new Readable();
    s._read = () => { };
    s.push(content);
    s.push(null);
    return s;
}

class SingleLevelProvider implements models.IArtifactProvider {
    artifactItemStore: ArtifactItemStore = new ArtifactItemStore();

    constructor(private rootItem: models.ArtifactItem, private children: models.ArtifactItem[] = []) { }

    getRootItems(): Promise<models.ArtifactItem[]> {
        return Promise.resolve([this.rootItem]);
    }

    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        if (artifactItem.path === this.rootItem.path) {
            return Promise.resolve(this.children);
        }
        return Promise.resolve([]);
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        const content = (artifactItem.metadata && artifactItem.metadata['content']) || '';
        return Promise.resolve(readStreamOf(content));
    }

    putArtifactItem(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem> {
        return Promise.resolve(artifactItem);
    }

    dispose(): void { }
}

describe('Unit Tests', () => {
    describe('artifactEngine real-filesystem regression tests (A4)', () => {
        let originalFeature: string | undefined;

        before(() => {
            tl.setResourcePath(path.join(__dirname, '..', 'lib.json'));
        });

        beforeEach(() => {
            originalFeature = process.env[featureVariable];
            process.env[featureVariable] = 'true';
        });

        afterEach(() => {
            if (originalFeature === undefined) {
                delete process.env[featureVariable];
            } else {
                process.env[featureVariable] = originalFeature;
            }
        });

        it('writes a nested file into a fresh destination root without truncating intermediate directories', async () => {
            const destRoot = makeTempRoot('aefs-nested-');
            try {
                const rootItem = new models.ArtifactItem();
                rootItem.itemType = models.ItemType.Folder;
                rootItem.path = '';

                const fileItem = new models.ArtifactItem();
                fileItem.itemType = models.ItemType.File;
                fileItem.path = path.join('folder', 'sub', 'file.txt');
                fileItem.metadata = { content: 'nested-content' };

                const source = new SingleLevelProvider(rootItem, [fileItem]);
                const dest = new FilesystemProvider(destRoot);

                await new ArtifactEngine().processItems(source, dest, new ArtifactEngineOptions());

                const expectedPath = path.join(destRoot, 'folder', 'sub', 'file.txt');
                assert.strictEqual(fs.existsSync(expectedPath), true, 'nested file should exist at full depth, not truncated to the root');
                assert.strictEqual(fs.readFileSync(expectedPath, 'utf8'), 'nested-content');
            }
            finally {
                (fs as any).rmSync(destRoot, { recursive: true, force: true });
            }
        });

        it('creates the destination root itself without EISDIR when the artifact path is empty (ZIP root)', async () => {
            const destRoot = makeTempRoot('aefs-ziproot-');
            try {
                const dest = new FilesystemProvider(destRoot);
                dest.artifactItemStore = new ArtifactItemStore();

                const rootFolderItem = new models.ArtifactItem();
                rootFolderItem.itemType = models.ItemType.Folder;
                rootFolderItem.path = '';

                await dest.putArtifactItem(rootFolderItem, null);

                assert.strictEqual(fs.existsSync(destRoot), true);
                assert.strictEqual(fs.statSync(destRoot).isDirectory(), true);
            }
            finally {
                (fs as any).rmSync(destRoot, { recursive: true, force: true });
            }
        });

        it('rejects processItems (reaches the caller) when an empty folder fails to be created at the destination', async () => {
            const destRoot = makeTempRoot('aefs-emptyfail-');
            try {
                fs.writeFileSync(path.join(destRoot, 'emptydir'), 'blocking-file');

                const rootItem = new models.ArtifactItem();
                rootItem.itemType = models.ItemType.Folder;
                rootItem.path = '';

                const emptyFolderItem = new models.ArtifactItem();
                emptyFolderItem.itemType = models.ItemType.Folder;
                emptyFolderItem.path = 'emptydir';

                const source = new SingleLevelProvider(rootItem, [emptyFolderItem]);
                const dest = new FilesystemProvider(destRoot);

                const options = new ArtifactEngineOptions();
                options.retryLimit = 1;

                await assert.rejects(() => new ArtifactEngine().processItems(source, dest, options));
            }
            finally {
                (fs as any).rmSync(destRoot, { recursive: true, force: true });
            }
        });

        it('does not retry a non-retryable security rejection for a path that escapes the root', async () => {
            const destRoot = makeTempRoot('aefs-nonretry-');
            try {
                const rootItem = new models.ArtifactItem();
                rootItem.itemType = models.ItemType.Folder;
                rootItem.path = '';

                const escapingFileItem = new models.ArtifactItem();
                escapingFileItem.itemType = models.ItemType.File;
                escapingFileItem.path = path.join(os.tmpdir(), `aefs-outside-${Date.now()}.txt`);
                escapingFileItem.metadata = { content: 'should-not-write' };

                const source = new SingleLevelProvider(rootItem, [escapingFileItem]);
                const dest = new FilesystemProvider(destRoot);

                const options = new ArtifactEngineOptions();
                options.retryLimit = 5;

                const putArtifactItemSpy = sinon.spy(dest, 'putArtifactItem');
                await assert.rejects(
                    () => new ArtifactEngine().processItems(source, dest, options),
                    (err: any) => {
                        assert.strictEqual(err.nonRetryable, true);
                        return true;
                    }
                );
                assert.strictEqual(putArtifactItemSpy.callCount, 1, 'a non-retryable error must reject immediately, without retrying the write');
            }
            finally {
                (fs as any).rmSync(destRoot, { recursive: true, force: true });
            }
        });
    });
});
