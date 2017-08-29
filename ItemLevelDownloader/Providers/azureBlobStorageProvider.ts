import * as path from 'path';
import * as fs from 'fs';

import * as azureStorage from 'azure-storage';

import * as models from "../Models"
import * as Stream from "stream";

export class AzureBlobProvider implements models.IArtifactProvider {
    constructor(storageAccount: string, container: string, accessKey: string, prefixFolderPath?: string) {
        this._storageAccount = storageAccount;
        this._accessKey = accessKey;
        this._container = container;
        this._prefixFolderPath = prefixFolderPath;
        this._blobSvc = azureStorage.createBlobService(this._storageAccount, this._accessKey);
    }

    public putArtifactItem(item: models.ArtifactItem, readStream: Stream.Readable): Promise<models.ArtifactItem> {
        return new Promise(async (resolve, reject) => {
            var newArtifactItem: models.ArtifactItem = models.ArtifactItem.clone(item);
            await this._ensureContainerExistence();

            var self = this;
            console.log("Uploading '%s'", item.path);
            var blobPath = this._prefixFolderPath ? this._prefixFolderPath + "/" + item.path : item.path;

            var writeStream = this._blobSvc.createWriteStreamToBlockBlob(this._container, blobPath, null, function (error, result, response) {
                if (error) {
                    console.log("Failed to create blob " + blobPath + ". Error: " + error.message);
                    reject(error);
                } else {
                    var blobUrl = self._blobSvc.getUrl(self._container, blobPath);
                    console.log("Created blob for item " + item.path + ". Blob uri: " + blobUrl);
                    newArtifactItem.metadata["downloadUrl"] = blobUrl;
                    resolve(newArtifactItem);
                }
            });

            readStream.pipe(writeStream);
            writeStream.on("error",
                (error) => {
                    reject(error);
                });
            readStream.on("error",
                (error) => {
                    reject(error);
                });
        });
    }

    public getRootItems(): Promise<models.ArtifactItem[]> {
        throw new Error("Method not implemented.");
    }

    public getArtifactItems(): Promise<models.ArtifactItem[]> {
        throw new Error("Not implemented");
    }

    public getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Readable> {
        throw new Error("Not implemented");
    }

    private _ensureContainerExistence(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            if (!this._isContainerExists) {
                var self = this;
                this._blobSvc.createContainerIfNotExists(this._container, function (error, result, response) {
                    if (!!error) {
                        console.log("Failed to create container " + self._container + ". Error: " + error.message);
                        reject(error);
                    } else {
                        self._isContainerExists = true;
                        console.log("Created container " + self._container);
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    private _storageAccount: string;
    private _accessKey: string;
    private _container: string;
    private _prefixFolderPath: string;
    private _isContainerExists: boolean = false;
    private _blobSvc: azureStorage.BlobService;
}