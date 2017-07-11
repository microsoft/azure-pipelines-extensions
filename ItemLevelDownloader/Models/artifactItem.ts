import {ItemType} from "./itemType"

export class ArtifactItem {
    itemType: ItemType;
    path: string;
    fileLength: number;
    lastModified: Date;
    metaData: { [key: string]: string }
}