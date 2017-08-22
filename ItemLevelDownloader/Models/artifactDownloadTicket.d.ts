import { ArtifactItem } from "./artifactItem";
import { TicketState } from "./ticketState";
export declare class ArtifactDownloadTicket {
    artifactItem: ArtifactItem;
    startTime: Date;
    finishTime: Date;
    state: TicketState;
}
