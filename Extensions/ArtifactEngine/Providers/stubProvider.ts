import * as Stream from 'stream';

import * as models from '../Models';
import { ItemType } from '../Models';

export class StubProvider implements models.IArtifactProvider {

    public getArtifactItemCalledCount = 0;
    public getArtifactItemsCalledCount = 0;

    public getRootItemsCalledCount = 0;

    public itemsDownloaded: models.ArtifactItem[] = [];

    public itemsUploaded: { [item: string]: string } = {};

    async getRootItems(): Promise<models.ArtifactItem[]> {
        this.getRootItemsCalledCount++;
        return [this.getItem(1, 1, 3, ItemType.File), this.getItem(1, 2, 3, ItemType.File), this.getItem(1, 3, 3, ItemType.File), this.getItem(2, 1, 1, ItemType.Folder), this.getItem(3, 1, 5, ItemType.File), this.getItem(4, 1, 3, ItemType.File), this.getItem(5, 1, 4, ItemType.Folder)];
    }

    async getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        this.getArtifactItemsCalledCount++;

        if (artifactItem.path === 'path5') {
            return [this.getItem(5, 1, 2, ItemType.File)];
        }

        return [];
    }

    async getArtifactItem(artifactItem: models.ArtifactItem): Promise<NodeJS.ReadableStream> {
        this.getArtifactItemCalledCount++;
        this.itemsDownloaded.push(artifactItem);

        await this.delay(artifactItem.fileLength * 100);

        const s = new Stream.Readable();
        s._read = () => { };
        s.push(`stub content for ${artifactItem.path}`);
        s.push(null);

        return s;
    }

    getItem(index: number, subIndex: number, length: number, itemType: ItemType): models.ArtifactItem {
        const artifactItem = new models.ArtifactItem();
        const path = itemType === ItemType.File ? `path${index}\\path${subIndex}\\file${index}` : `path${index}`
        artifactItem.path = path;
        artifactItem.fileLength = length;
        artifactItem.itemType = itemType;
        artifactItem.metadata = {};

        return artifactItem;
    }

    putArtifactItem(item: models.ArtifactItem, readStream: NodeJS.ReadableStream): Promise<models.ArtifactItem> {
        var promise = new Promise<models.ArtifactItem>((resolve, reject) => {
            var data = ''
            readStream.on('data', (chunk) => {
                data += chunk;
            });

            readStream.on('end', () => {
                this.itemsUploaded[item.path] = data;
                resolve(item)
            });

            readStream.on('error', () => {
                reject(item);
            });
        });

        return promise;
    }

    dispose(): void {
    }

    delay(ms: number): Promise<{}> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}