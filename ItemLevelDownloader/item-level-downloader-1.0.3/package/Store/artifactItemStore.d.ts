import * as models from "../Models";
export declare class ArtifactItemStore {
    _downloadTickets: models.ArtifactDownloadTicket[];
    addItem(item: models.ArtifactItem): void;
    addItems(items: models.ArtifactItem[]): void;
    getNextItemToProcess(): models.ArtifactItem;
    markAsProcessed(item: models.ArtifactItem): void;
    size(): number;
}
