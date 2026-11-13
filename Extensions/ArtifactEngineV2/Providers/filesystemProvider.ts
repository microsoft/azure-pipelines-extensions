import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import * as models from '../Models';
import { Logger } from '../Engine/logger';
import * as ci from '../Engine/cilogger';
import { ArtifactItemStore } from '../Store/artifactItemStore';
import { isFilesystemCaseInsensitive } from './filesystemCaseSensitivity';

var tl = require('azure-pipelines-task-lib');

export class FilesystemProvider implements models.IArtifactProvider {

    public artifactItemStore: ArtifactItemStore;

    constructor(rootLocation: string, rootItemPath?: string) {
        this._rootLocation = rootLocation;
        this._rootItemPath = rootItemPath ? rootItemPath : '';
    }

    getRootItems(): Promise<models.ArtifactItem[]> {
        var rootItem = new models.ArtifactItem();
        rootItem.metadata = { downloadUrl: this._rootLocation };
        rootItem.path = this._rootItemPath;
        rootItem.itemType = models.ItemType.Folder;
        return Promise.resolve([rootItem]);
    }

    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        var itemsPath = artifactItem.metadata["downloadUrl"];
        return this.getItems(itemsPath, artifactItem.path);
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            var itemPath: string = artifactItem.metadata['downloadUrl'];
            try {
                var contentStream = fs.createReadStream(itemPath);
                contentStream.on('end', () => {
                    this.artifactItemStore.updateDownloadSize(artifactItem, contentStream.bytesRead);
                });
                contentStream.on("error",
                    (error) => {
                        reject(error);
                    });
                resolve(contentStream);
            } catch (error) {
                reject(error);
            }
        });

        return promise;
    }

    public putArtifactItem(item: models.ArtifactItem, stream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        if (!tl.getPipelineFeature("EnableArtifactEnginePathValidation") || tl.getPipelineFeature("EnableLegacyArtifactPathValidation")) {
            return this.putArtifactItemLegacy(item, stream);
        }

        return this.putArtifactItemSecure(item, stream);
    }

    // Unmodified pre-fix implementation. Runs verbatim whenever path validation is off, or
    // EnableLegacyArtifactPathValidation is On, so rollback restores the exact legacy behavior.
    private putArtifactItemLegacy(item: models.ArtifactItem, stream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        return new Promise((resolve, reject) => {
            let outputItemPath: string;
            if (!tl.getPipelineFeature("EnableArtifactEnginePathValidation")) {
                outputItemPath = path.join(this._rootLocation, item.path);
            }
            else {
                // Feature on: reject item paths that resolve outside the download root.
                const resolvedRoot: string = path.resolve(this._rootLocation);
                const resolvedTarget: string = path.resolve(resolvedRoot, item.path);
                const relative: string = path.relative(resolvedRoot, resolvedTarget);
                if (relative === '..'
                    || relative.startsWith('..' + path.sep)
                    || path.isAbsolute(relative)) {
                    reject(new Error(tl.loc("InvalidArtifactPath", item.path)));
                    return;
                }
                outputItemPath = resolvedTarget;
            }

            if (item.itemType === models.ItemType.File) {
                const folder = path.dirname(outputItemPath);
                try {
                    // create parent folder if it has not already been created
                    tl.mkdirP(folder);

                    Logger.messageExternalOutput(tl.loc("DownloadingTo", item.path, outputItemPath));
                    const outputStream = fs.createWriteStream(outputItemPath);
                    stream.pipe(outputStream);
                    stream.on("end",
                        () => {
                            Logger.messageExternalOutput(tl.loc("DownloadedTo", item.path, outputItemPath));
                            if (!item.metadata) {
                                item.metadata = {};
                            }

                            item.metadata[models.Constants.DestinationUrlKey] = outputItemPath;
                        });
                    stream.on("error",
                        (error) => {
                            reject(error);
                        });
                    outputStream.on("finish", () => {
                        this.artifactItemStore.updateFileSize(item, outputStream.bytesWritten);
                        resolve(item);
                    });
                }
                catch (err) {
                    reject(err);
                }
            }
            else {
                try {
                    tl.mkdirP(outputItemPath);
                    resolve(item);
                }
                catch (err) {
                    reject(err);
                }
            }
        });
    }

    private putArtifactItemSecure(item: models.ArtifactItem, stream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        return new Promise((resolve, reject) => {
            let outputItemPath: string;
            try {
                outputItemPath = this.resolveSafeOutputPath(item.path);
            }
            catch (err) {
                if (stream && typeof (stream as any).destroy === 'function') {
                    (stream as any).destroy();
                }
                reject(err);
                return;
            }

            if (item.itemType === models.ItemType.File) {
                const folder = path.dirname(outputItemPath);
                const tempItemPath = this.getTempWritePath(outputItemPath);
                let settled = false;
                const cleanupTempFile = () => {
                    fs.unlink(tempItemPath, () => { /* best-effort cleanup */ });
                };
                try {
                    tl.mkdirP(folder);

                    Logger.messageExternalOutput(tl.loc("DownloadingTo", item.path, outputItemPath));
                    const writeOptions = { flags: this.getWriteOpenFlags() } as any;
                    const outputStream = fs.createWriteStream(tempItemPath, writeOptions);
                    stream.pipe(outputStream);
                    stream.on("end",
                        () => {
                            Logger.messageExternalOutput(tl.loc("DownloadedTo", item.path, outputItemPath));
                            if (!item.metadata) {
                                item.metadata = {};
                            }

                            item.metadata[models.Constants.DestinationUrlKey] = outputItemPath;
                        });
                    stream.on("error",
                        (error) => {
                            if (settled) { return; }
                            settled = true;
                            cleanupTempFile();
                            reject(error);
                        });
                    outputStream.on("error",
                        (error) => {
                            if (settled) { return; }
                            settled = true;
                            cleanupTempFile();
                            reject(error);
                        });
                    outputStream.on("finish", () => {
                        if (settled) { return; }
                        try {
                            fs.renameSync(tempItemPath, outputItemPath);
                        }
                        catch (renameErr) {
                            settled = true;
                            cleanupTempFile();
                            reject(renameErr);
                            return;
                        }
                        settled = true;
                        this.artifactItemStore.updateFileSize(item, outputStream.bytesWritten);
                        resolve(item);
                    });
                }
                catch (err) {
                    cleanupTempFile();
                    reject(err);
                }
            }
            else {
                try {
                    this.createValidatedDirectory(outputItemPath, item.path);
                    resolve(item);
                }
                catch (err) {
                    reject(err);
                }
            }
        });
    }

    private getWriteOpenFlags(): number {
        let flags: number = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC;
        if (typeof fs.constants.O_NOFOLLOW === 'number') {
            flags |= fs.constants.O_NOFOLLOW;
        }
        return flags;
    }

    private getTempWritePath(outputItemPath: string): string {
        const dir = path.dirname(outputItemPath);
        const base = path.basename(outputItemPath);
        const unique = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return path.join(dir, `.${base}.tmp-${unique}`);
    }

    private createSecurityRejection(messageKey: string, itemPath: string, cause?: any): Error {
        const err: any = new Error(tl.loc(messageKey, itemPath));
        err.nonRetryable = true;
        if (cause !== undefined && cause !== null) {
            err.cause = cause;
        }

        try {
            ci.publishEvent('pathValidationRejection', {
                reason: messageKey,
                causeCode: cause && cause.code ? cause.code : undefined,
                pathValidationFlag: !!tl.getPipelineFeature("EnableArtifactEnginePathValidation"),
                legacyPathValidationFlag: !!tl.getPipelineFeature("EnableLegacyArtifactPathValidation"),
                os: os.platform(),
                provider: 'filesystem'
            });
        }
        catch (telemetryErr) {
            // Telemetry must never block or fail the rejection it is reporting on.
        }

        return err;
    }

    // Creates a directory-type artifact's final path segment with the same symlink-safe
    // guarantee as the intermediate segments in resolveSafeOutputPath, instead of an
    // unchecked mkdirP call that would reopen the TOCTOU window the latter closes.
    private createValidatedDirectory(dirPath: string, itemPath: string): void {
        try {
            fs.mkdirSync(dirPath);
            return;
        }
        catch (err) {
            if (!err || err.code !== 'EEXIST') {
                throw err;
            }
        }

        let raceStat: fs.Stats;
        try {
            raceStat = fs.lstatSync(dirPath);
        }
        catch (raceErr) {
            throw this.createSecurityRejection("InvalidArtifactPath", itemPath, raceErr);
        }

        const resolvedRoot: string = path.resolve(this._rootLocation);
        let realRoot: string;
        try {
            realRoot = fs.realpathSync(resolvedRoot);
        }
        catch (err) {
            realRoot = resolvedRoot;
        }

        this.validateExistingIntermediateSegment(dirPath, raceStat, realRoot, itemPath);
    }

    private validateExistingIntermediateSegment(current: string, stat: fs.Stats, realRoot: string, itemPath: string): string {
        if (stat.isSymbolicLink()) {
            let real: string;
            try {
                real = fs.realpathSync(current);
            }
            catch (err) {
                throw this.createSecurityRejection("InvalidArtifactPath", itemPath, err);
            }
            const relToRoot: string = path.relative(realRoot, real);
            if (relToRoot === '..'
                || relToRoot.startsWith('..' + path.sep)
                || path.isAbsolute(relToRoot)) {
                throw this.createSecurityRejection("InvalidArtifactPath", itemPath);
            }
            return real;
        }

        if (!stat.isDirectory()) {
            throw this.createSecurityRejection("InvalidArtifactPath", itemPath);
        }

        return current;
    }

    private resolveSafeOutputPath(itemPath: string): string {
        const resolvedRoot: string = path.resolve(this._rootLocation);
        const resolvedTarget: string = path.resolve(resolvedRoot, itemPath);
        const relative: string = path.relative(resolvedRoot, resolvedTarget);
        if (relative === '..'
            || relative.startsWith('..' + path.sep)
            || path.isAbsolute(relative)) {
            throw this.createSecurityRejection("InvalidArtifactPath", itemPath);
        }

        let realRoot: string;
        try {
            realRoot = fs.realpathSync(resolvedRoot);
        }
        catch (err) {
            realRoot = resolvedRoot;
        }

        const segments: string[] = relative.split(path.sep);
        let current: string = realRoot;
        for (let i = 0; i < segments.length - 1; i++) {
            current = path.join(current, segments[i]);

            let stat: fs.Stats;
            try {
                stat = fs.lstatSync(current);
            }
            catch (err) {
                if (err && err.code !== 'ENOENT') {
                    throw this.createSecurityRejection("InvalidArtifactPath", itemPath, err);
                }

                try {
                    fs.mkdirSync(current);
                    continue;
                }
                catch (mkdirErr) {
                    if (!mkdirErr || mkdirErr.code !== 'EEXIST') {
                        throw mkdirErr;
                    }

                    let raceStat: fs.Stats;
                    try {
                        raceStat = fs.lstatSync(current);
                    }
                    catch (raceErr) {
                        throw this.createSecurityRejection("InvalidArtifactPath", itemPath, raceErr);
                    }
                    current = this.validateExistingIntermediateSegment(current, raceStat, realRoot, itemPath);
                    continue;
                }
            }

            current = this.validateExistingIntermediateSegment(current, stat, realRoot, itemPath);
        }

        const finalPath: string = path.join(current, segments[segments.length - 1]);
        try {
            const finalStat: fs.Stats = fs.lstatSync(finalPath);
            if (finalStat.isSymbolicLink()) {
                throw this.createSecurityRejection("ArtifactPathIsSymlink", itemPath);
            }
            if (!finalStat.isFile() && !finalStat.isDirectory()) {
                throw this.createSecurityRejection("ArtifactPathIsSpecialFile", itemPath);
            }
        }
        catch (err) {
            if (err && err.nonRetryable) {
                throw err;
            }
            if (err && err.code !== 'ENOENT') {
                throw this.createSecurityRejection("InvalidArtifactPath", itemPath, err);
            }
        }

        return finalPath;
    }

    public isCaseInsensitiveFilesystem(): boolean {
        if (!this._hasDeterminedFilesystemCaseSensitivity) {
            try {
                this._isCaseInsensitiveFilesystem = isFilesystemCaseInsensitive(this._rootLocation);
            }
            catch (error) {
                this._isCaseInsensitiveFilesystem = false;
            }

            this._hasDeterminedFilesystemCaseSensitivity = true;
        }

        return this._isCaseInsensitiveFilesystem;
    }

    dispose(): void {
    }

    private getItems(itemsPath: string, parentRelativePath?: string): Promise<models.ArtifactItem[]> {
        var promise = new Promise<models.ArtifactItem[]>((resolve, reject) => {
            var items: models.ArtifactItem[] = [];
            fs.readdir(itemsPath, (error, files) => {
                if (!!error) {
                    Logger.messageExternalOutput(tl.loc("UnableToReadDirectory", itemsPath, error));
                    reject(error);
                    return;
                }

                for (var index = 0; index < files.length; index++) {
                    var file = files[index];
                    var filePath = path.join(itemsPath, file);

                    // do not follow symbolic link
                    var itemStat;
                    try {
                        itemStat = fs.lstatSync(filePath);
                    } catch (error) {
                        reject(error);
                        return;
                    }

                    var item: models.ArtifactItem = <models.ArtifactItem>{
                        itemType: itemStat.isFile() ? models.ItemType.File : models.ItemType.Folder,
                        path: parentRelativePath ? path.join(parentRelativePath, file) : file,
                        fileLength: itemStat.size,
                        lastModified: itemStat.mtime,
                        contentType: undefined,
                        metadata: { "downloadUrl": filePath }
                    }

                    items = items.concat(item);
                }

                resolve(items);
            });
        });

        return promise;
    }

    private _rootLocation: string;
    private _rootItemPath: string;
    private _hasDeterminedFilesystemCaseSensitivity = false;
    private _isCaseInsensitiveFilesystem = false;
}