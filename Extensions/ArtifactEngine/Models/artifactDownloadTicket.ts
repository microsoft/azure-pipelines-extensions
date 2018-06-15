import { ArtifactItem } from "./artifactItem";
import { TicketState } from "./ticketState";

export class ArtifactDownloadTicket {
    artifactItem: ArtifactItem;
    downloadedFromCache : boolean;
    startTime: Date
    finishTime: Date
    state: TicketState
    retryCount: number
    downloadSizeInBytes: number
    fileSizeInBytes: number
}