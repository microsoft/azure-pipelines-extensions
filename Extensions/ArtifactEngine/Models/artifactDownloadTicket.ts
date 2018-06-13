import { ArtifactItem } from "./artifactItem";
import { TicketState } from "./ticketState";
import { DownloadLocation } from "./downloadLocation";

export class ArtifactDownloadTicket {
    artifactItem: ArtifactItem;
    downloadLocation : DownloadLocation;
    startTime: Date
    finishTime: Date
    state: TicketState
    retryCount: number
    downloadSizeInBytes: number
    fileSizeInBytes: number
}