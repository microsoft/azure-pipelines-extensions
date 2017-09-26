import * as Stream from 'stream';

import * as models from '../Models';
import { ItemType } from '../Models';

export class StubProvider implements models.IArtifactProvider {

    public getArtifactItemCalledCount = 0;
    public getArtifactItemsCalledCount = 0;

    public getRootItemsCalledCount = 0;

    public itemsDownloaded: models.ArtifactItem[] = [];

    async getRootItems(): Promise<models.ArtifactItem[]> {
        this.getRootItemsCalledCount++;
        return [this.getItem(1, 2, ItemType.File), this.getItem(2, 1, ItemType.Folder), this.getItem(3, 5, ItemType.File), this.getItem(4, 3, ItemType.File), this.getItem(5, 4, ItemType.Folder)];
    }

    async getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]> {
        this.getArtifactItemsCalledCount++;

        if(artifactItem.path === 'path5'){
            return [this.getItem(5, 2, ItemType.File)];
        }

        return [];
    }

    async getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Readable> {
        this.getArtifactItemCalledCount++;
        this.itemsDownloaded.push(artifactItem);

        await this.delay(artifactItem.fileLength * 100);

        const s = new Stream.Readable();
        s._read = () => { };
        s.push(`stub content for ${artifactItem.path}`);
        s.push(null);

        return s;
    }

    getItem(index: number, length: number, itemType: ItemType): models.ArtifactItem {
        const artifactItem = new models.ArtifactItem();
        const path = itemType === ItemType.File ? `path${index}\\file${index}`: `path${index}`
        artifactItem.path = path;
        artifactItem.fileLength = length;
        artifactItem.itemType = itemType;
        artifactItem.metadata = {};

        return artifactItem;
    }

    putArtifactItem(item: models.ArtifactItem, readStream: Stream.Readable): Promise<models.ArtifactItem> {
        return Promise.resolve(item);
    }

    delay(ms: number): Promise<{}> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}