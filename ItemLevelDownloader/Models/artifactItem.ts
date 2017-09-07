import { ItemType } from "./itemType"

export class ArtifactItem {
    itemType: ItemType;
    path: string;
    fileLength: number;
    lastModified: Date;
    metadata: { [key: string]: string }

    public static clone(item: ArtifactItem): ArtifactItem {
        var clonedItem = new ArtifactItem();
        clonedItem.itemType = item.itemType;
        clonedItem.path = item.path;
        clonedItem.fileLength = item.fileLength;
        clonedItem.lastModified = item.lastModified;
        clonedItem.metadata = {}

        if (!!item.metadata) {
            for (var key of Object.keys(item.metadata)) {
                clonedItem.metadata[key] = item.metadata[key];
            }
        }

        return clonedItem;
    }
}