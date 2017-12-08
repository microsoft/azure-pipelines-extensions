import * as models from "../Models"

export class ArtifactItemStore {
    _downloadTickets: models.ArtifactDownloadTicket[] = [];

    public addItem(item: models.ArtifactItem) {
        if (this._downloadTickets.find(x => x.artifactItem.path === item.path)) {
            return;
        }

        var artifactDownloadTicket: models.ArtifactDownloadTicket = {
            artifactItem: item,
            state: models.TicketState.InQueue,
            startTime: undefined,
            finishTime: undefined,
            retryCount: 0,
            downloadSizeInBytes: 0,
            fileSizeInBytes: 0
        };

        this._downloadTickets.push(artifactDownloadTicket);
    }

    public addItems(items: models.ArtifactItem[]): void {
        items.map((value: models.ArtifactItem, index: number) => {
            this.addItem(value);
        });
    }

    public getTickets(): models.ArtifactDownloadTicket[] {
        return this._downloadTickets;
    }

    public itemsPendingProcessing(): boolean {
        var processingTickets = this._downloadTickets.filter(x => x.state === models.TicketState.Processing || x.state === models.TicketState.InQueue);
        return processingTickets.length != 0;
    }

    public getNextItemToProcess(): models.ArtifactItem {
        var nextItemToProcess = this._downloadTickets.find(x => x.state === models.TicketState.InQueue);
        if (nextItemToProcess) {
            nextItemToProcess.state = models.TicketState.Processing;
            nextItemToProcess.startTime = new Date();
            return nextItemToProcess.artifactItem;
        }

        return undefined;
    }

    public updateState(item: models.ArtifactItem, state: models.TicketState) {
        var processedItem = this._downloadTickets.find(x => x.artifactItem.path === item.path);
        if (processedItem) {
            processedItem.state = state;
            if (state != models.TicketState.InQueue && state != models.TicketState.Processing) {
                processedItem.finishTime = new Date();
            }
        }
    }

    public getRootLocation(): string {
        var rootItem = this._downloadTickets.find(x => x.artifactItem.path === "");
        var rootLocation = '';
        if (rootItem && rootItem.artifactItem.metadata) {
            rootLocation = rootItem.artifactItem.metadata["downloadUrl"];
        }

        return rootLocation ? rootLocation : '';
    }

    public increaseRetryCount(item: models.ArtifactItem) {
        var ticket = this._downloadTickets.find(x => x.artifactItem.path === item.path);
        if (ticket) {
            ticket.retryCount = ticket.retryCount + 1;
        }
    }

    public updateDownloadSize(item: models.ArtifactItem, downloadSizeInBytes: number) {
        var ticket = this._downloadTickets.find(x => x.artifactItem.path === item.path);
        if (ticket) {
            ticket.downloadSizeInBytes = downloadSizeInBytes;
        }
    }

    public updateFileSize(item: models.ArtifactItem, fileSizeInBytes: number) {
        var ticket = this._downloadTickets.find(x => x.artifactItem.path === item.path);
        if (ticket) {
            ticket.fileSizeInBytes = fileSizeInBytes;
        }
    }

    public size(): number {
        return this._downloadTickets.length;
    }

    public flush(): void {
        this._downloadTickets = [];
    }
}