import * as assert from 'assert';
import * as path from 'path';

import {
    FileSystemCaseSensitivityProbe,
    isFilesystemCaseInsensitive
} from '../Providers/filesystemCaseSensitivity';

class TestFileSystemProbe implements FileSystemCaseSensitivityProbe {
    constructor(
        private readonly existingPaths: string[],
        private readonly directoryEntries: { [directory: string]: string[] },
        private readonly isCaseInsensitive: boolean,
        private readonly deviceIds: { [path: string]: number } = {},
        private readonly failDirectoryRead: boolean = false) {
    }

    public enumeratedPaths: string[] = [];

    public existsSync(filePath: string): boolean {
        return this.existingPaths.some((existingPath) =>
            this.isCaseInsensitive
                ? existingPath.toLowerCase() === filePath.toLowerCase()
                : existingPath === filePath);
    }

    public readdirSync(directoryPath: string): string[] {
        this.enumeratedPaths.push(directoryPath);
        if (this.failDirectoryRead) {
            throw new Error('Directory cannot be read');
        }

        const entries = this.directoryEntries[directoryPath];
        if (!entries) {
            throw new Error(`Unknown directory: ${directoryPath}`);
        }

        return entries;
    }

    public statSync(filePath: string): { dev: number } {
        const deviceId = this.deviceIds[filePath];
        if (deviceId === undefined) {
            throw new Error(`Unknown device: ${filePath}`);
        }

        return { dev: deviceId };
    }
}

class MountBoundaryProbe implements FileSystemCaseSensitivityProbe {
    public enumeratedPaths: string[] = [];

    public existsSync(filePath: string): boolean {
        return filePath === '/Volumes/ArtifactCaseSensitive'
            || filePath === '/Volumes/artifactCaseSensitive'
            || filePath === '/Volumes/ArtifactCaseSensitive/download';
    }

    public readdirSync(directoryPath: string): string[] {
        this.enumeratedPaths.push(directoryPath);
        if (directoryPath === '/Volumes/ArtifactCaseSensitive') {
            return ['download'];
        }

        if (directoryPath === '/Volumes') {
            return ['ArtifactCaseSensitive'];
        }

        throw new Error(`Unexpected directory: ${directoryPath}`);
    }

    public statSync(filePath: string): { dev: number } {
        throw new Error(`Unexpected stat: ${filePath}`);
    }
}

describe('Unit Tests', () => {
    describe('filesystem case sensitivity tests', () => {
        it('detects a case-insensitive Windows root destination filesystem', () => {
            const destinationPath = 'C:\\';
            const probe = new TestFileSystemProbe(
                ['C:\\', 'C:\\agent'],
                { 'C:\\': ['agent'] },
                true);

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.win32),
                true);
        });

        it('detects a case-insensitive macOS destination filesystem', () => {
            const destinationPath = '/Volumes/Build/download';
            const probe = new TestFileSystemProbe(
                [destinationPath, destinationPath + '/artifact.txt'],
                { [destinationPath]: ['artifact.txt'] },
                true);

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                true);
        });

        it('keeps matching case-sensitive for a Linux destination filesystem', () => {
            const destinationPath = '/agent/_work/1/s';
            const probe = new TestFileSystemProbe(
                [destinationPath, destinationPath + '/artifact.txt'],
                { [destinationPath]: ['artifact.txt'] },
                false);

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                false);
        });

        it('keeps matching case-sensitive for a case-sensitive macOS destination filesystem', () => {
            const destinationPath = '/Volumes/Build/download';
            const probe = new TestFileSystemProbe(
                [destinationPath, destinationPath + '/artifact.txt'],
                { [destinationPath]: ['artifact.txt'] },
                false);

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                false);
        });

        it('does not use the parent filesystem across a destination mount boundary', () => {
            const destinationPath = '/Volumes/ArtifactCaseSensitive';
            const probe = new MountBoundaryProbe();

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                false);
            assert.deepStrictEqual(probe.enumeratedPaths, [destinationPath]);
        });

        it('ascends from an empty destination directory on the same filesystem', () => {
            const destinationPath = '/Volumes/Build/download';
            const parentPath = '/Volumes/Build';
            const probe = new TestFileSystemProbe(
                [destinationPath, parentPath, parentPath + '/workspace'],
                {
                    [destinationPath]: [],
                    [parentPath]: ['workspace']
                },
                true,
                {
                    [destinationPath]: 1,
                    [parentPath]: 1
                });

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                true);
            assert.deepStrictEqual(probe.enumeratedPaths, [destinationPath, parentPath]);
        });

        it('uses the nearest existing ancestor for a nonexistent destination', () => {
            const destinationPath = '/Volumes/Build/download';
            const parentPath = '/Volumes/Build';
            const probe = new TestFileSystemProbe(
                [parentPath, parentPath + '/workspace'],
                { [parentPath]: ['workspace'] },
                true);

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                true);
            assert.deepStrictEqual(probe.enumeratedPaths, [parentPath]);
        });

        it('does not ascend from an empty mounted destination directory', () => {
            const destinationPath = '/Volumes/ArtifactCaseSensitive';
            const parentPath = '/Volumes';
            const probe = new TestFileSystemProbe(
                [destinationPath, parentPath, parentPath + '/caseInsensitiveParent'],
                {
                    [destinationPath]: [],
                    [parentPath]: ['caseInsensitiveParent']
                },
                true,
                {
                    [destinationPath]: 2,
                    [parentPath]: 1
                });

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                false);
            assert.deepStrictEqual(probe.enumeratedPaths, [destinationPath]);
        });

        it('does not leave the destination filesystem for a nonexistent path below an empty mount', () => {
            const destinationPath = '/Volumes/ArtifactCaseSensitive/download';
            const mountPath = '/Volumes/ArtifactCaseSensitive';
            const parentPath = '/Volumes';
            const probe = new TestFileSystemProbe(
                [mountPath, parentPath, parentPath + '/caseInsensitiveParent'],
                {
                    [mountPath]: [],
                    [parentPath]: ['caseInsensitiveParent']
                },
                true,
                {
                    [mountPath]: 2,
                    [parentPath]: 1
                });

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, probe, path.posix),
                false);
            assert.deepStrictEqual(probe.enumeratedPaths, [mountPath]);
        });

        it('keeps matching case-sensitive for an empty root destination directory', () => {
            const probe = new TestFileSystemProbe(
                ['/'],
                { '/': [] },
                true);

            assert.strictEqual(
                isFilesystemCaseInsensitive('/', probe, path.posix),
                false);
        });

        it('keeps matching case-sensitive when the destination directory is indeterminate or fails', () => {
            const destinationPath = '/Volumes/Build/download';
            const ambiguousProbe = new TestFileSystemProbe(
                [destinationPath, destinationPath + '/artifact.txt', destinationPath + '/ARTIFACT.txt'],
                { [destinationPath]: ['artifact.txt', 'ARTIFACT.txt'] },
                true);
            const emptyProbe = new TestFileSystemProbe(
                [destinationPath],
                { [destinationPath]: [] },
                true);
            const failingProbe = new TestFileSystemProbe(
                [destinationPath],
                { [destinationPath]: ['artifact.txt'] },
                true,
                {},
                true);

            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, emptyProbe, path.posix),
                false);
            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, ambiguousProbe, path.posix),
                false);
            assert.strictEqual(
                isFilesystemCaseInsensitive(destinationPath, failingProbe, path.posix),
                false);
        });
    });
});
