import * as fs from 'fs';
import * as crypto from 'crypto';

import { ArtifactItemStore } from '../Store/artifactItemStore';

import { ArtifactItem, IArtifactProvider, ItemType } from '../Models';
import * as factory from './webClientFactory';
import { WebClient } from './webClient'

// only import types from typed-rest-client here
import { IRequestHandler, IRequestOptions } from './typed-rest-client/Interfaces';
import { HttpClientResponse } from './typed-rest-client/HttpClient';

export class ZipProvider implements IArtifactProvider {
    public artifactItemStore: ArtifactItemStore;

    constructor(zipLocation, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.zipLocation = zipLocation;
        this.httpc = factory.WebClientFactory.getClient([handler], requestOptions);
    }

    public getRootItems(): Promise<ArtifactItem[]> {
        var rootItem = new ArtifactItem();
        rootItem.metadata = { downloadUrl: this.zipLocation };
        rootItem.path = '';
        rootItem.itemType = ItemType.File;
        return Promise.resolve([rootItem]);
    }

    public getArtifactItems(artifactItem: ArtifactItem): Promise<ArtifactItem[]> {
        return null;
    }

    public getArtifactItem(artifactItem: ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            if (!artifactItem.metadata || !artifactItem.metadata['downloadUrl']) {
                reject("No downloadUrl available to download the item.");
            }

            var downloadSize: number = 0;
            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            itemUrl = itemUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemUrl).then((res: HttpClientResponse) => {
                resolve(res.message);
            }, (reason) => {
                reject(reason);
            });
        });

        return promise;
    }

    public putArtifactItem(artifactItem: ArtifactItem, stream: NodeJS.ReadableStream): Promise<ArtifactItem> {
        return null;
    }

    public dispose(): void {
    }

    private zipLocation: string;
    public httpc: WebClient;
}