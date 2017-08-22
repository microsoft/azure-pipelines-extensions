import * as Stream from 'stream';
import * as models from '../Models';
import { ItemType } from '../Models';
export declare class StubProvider implements models.IArtifactProvider {
    getArtifactItemCalledCount: number;
    getArtifactItemsCalledCount: number;
    getRootItemsCalledCount: number;
    itemsDownloaded: models.ArtifactItem[];
    getRootItems(): Promise<models.ArtifactItem[]>;
    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]>;
    getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Readable>;
    getItem(index: number, length: number, itemType: ItemType): models.ArtifactItem;
    delay(ms: number): Promise<{}>;
}
