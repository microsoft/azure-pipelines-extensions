import {ItemType} from "./itemType"

export class ArtifactItem {
    itemType: ItemType;
    path: string;
    fileLength: number;
    lastModified: Date;
    metadata: { [key: string]: string }
}