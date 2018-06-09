import { ArtifactItemStore } from '../Store/artifactItemStore';
import { IRequestHandler, IRequestOptions } from './typed-rest-client/Interfaces';
import * as httpm from './typed-rest-client/HttpClient';
import * as models from '../Models';
import * as factory from './webClientFactory';

export class ZipProvider implements models.IArtifactProvider {
    public artifactItemStore: ArtifactItemStore;

    constructor(zipLocation, handler: IRequestHandler, requestOptions?: IRequestOptions) {
        this.zipLocation = zipLocation;
        this.httpc = factory.WebClientFactory.getClient([handler], requestOptions);
    }

    public getRootItems(): Promise<models.ArtifactItem[]> {
        var rootItem = new models.ArtifactItem();
        rootItem.metadata = { downloadUrl: this.zipLocation };
        rootItem.path = '';
        rootItem.itemType = models.ItemType.File;
        return Promise.resolve([rootItem]);
    }

    public getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        return null;
    }

    public getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        var promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            if (!artifactItem.metadata || !artifactItem.metadata['downloadUrl']) {
                reject("No downloadUrl available to download the item.");
            }

            var downloadSize: number = 0;
            var itemUrl: string = artifactItem.metadata['downloadUrl'];
            itemUrl = itemUrl.replace(/([^:]\/)\/+/g, "$1");
            this.httpc.get(itemUrl).then((res: httpm.HttpClientResponse) => {
                resolve(res.message);
            }, (reason) => {
                reject(reason);
            });
        });

        return promise;
    }

    public putArtifactItem(artifactItem: models.ArtifactItem, stream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        return null;
    }

    public dispose(): void {
    }

    private zipLocation: string;
    public httpc: httpm.HttpClient = new httpm.HttpClient('artifact-engine');
}