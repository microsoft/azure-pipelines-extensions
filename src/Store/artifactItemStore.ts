import * as models from "../Models"

export class ArtifactItemStore {
    _downloadTickets: models.ArtifactDownloadTicket[] = [];

    public add(item: models.ArtifactItem) {
        if (this._downloadTickets.find(x => x.artifactItem.path === item.path)) {
            return;
        }

        var artifactDownloadTicket: models.ArtifactDownloadTicket = {
            artifactItem: item,
            state: models.TicketState.InQueue,
            startTime: new Date(),
            finishTime: undefined
        };

        this._downloadTickets.push(artifactDownloadTicket);
    }

    public getNextItemToProcess(): models.ArtifactItem | undefined {
        var nextItemToProcess = this._downloadTickets.find(x => x.state === models.TicketState.InQueue);
        if (nextItemToProcess) {
            nextItemToProcess.state = models.TicketState.Processing;
            return nextItemToProcess.artifactItem;
        }

        return undefined;
    }

    public markAsProcessed(item: models.ArtifactItem) {
        var processedItem = this._downloadTickets.find(x => x.artifactItem.path === item.path);
        if (processedItem) {
            processedItem.state = models.TicketState.Processed;
        }
    }

    public size(): number {
        return this._downloadTickets.length;
    }
}