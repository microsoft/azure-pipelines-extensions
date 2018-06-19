import { ItemType } from "./itemType"

export class ArtifactItem {
    itemType: ItemType;
    path: string;
    fileLength: number;
    downloadedFileHash: string;
    fileHash: string;
    lastModified: Date;
    metadata: { [key: string]: string }

    constructor() {
        this.metadata = {};
    }
}