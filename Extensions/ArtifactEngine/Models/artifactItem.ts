import { ItemType } from "./itemType"

export class ArtifactItem {
    itemType: ItemType;
    path: string;
    fileLength: number;
    fileHash: string;
    lastModified: Date;
    metadata: { [key: string]: string }

    constructor() {
        this.metadata = {};
    }
}