import { ItemType } from "./itemType";
export declare class ArtifactItem {
    itemType: ItemType;
    path: string;
    fileLength: number;
    lastModified: Date;
    metadata: {
        [key: string]: string;
    };
}
