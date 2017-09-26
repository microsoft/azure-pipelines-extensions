import { ItemType } from '../Models';
import { TicketState } from '../Models/ticketState';
import { ArtifactItemStore } from '../Store/artifactItemStore';

export class Logger {

    constructor(store: ArtifactItemStore) {
        this.store = store;
        this.startTime = new Date();
    }

    public static logInfo(message: string) {
        if (this.verbose) {
            console.info(message);
        }
    }

    public static logError(message: string) {
        console.error(message);
    }

    public static logMessage(message: string) {
        console.log(message);
    }

    public logProgress() {
        if (Logger.verbose) {
            var progressLogger = async () => setTimeout(() => {
                var tickets = this.store.getTickets();
                var queuedItems = tickets.filter(x => x.state == TicketState.InQueue);
                var processingItems = tickets.filter(x => x.state == TicketState.Processing);
                var processedItems = tickets.filter(x => x.state == TicketState.Processed);
                var skippedItems = tickets.filter(x => x.state == TicketState.Skipped);
                var failedItems = tickets.filter(x => x.state == TicketState.Failed);

                var currentTime = new Date();

                console.log(
                    "Total: " + tickets.length
                    + ", Processed: " + processedItems.length
                    + ", Processing: " + processingItems.length
                    + ", Queued: " + queuedItems.length
                    + ", Skipped: " + skippedItems.length
                    + ", Failed: " + failedItems.length
                    + ", Time elapsed: " + ((currentTime.valueOf() - this.startTime.valueOf()) / 1000) + "secs");

                if (this.store.itemsPendingProcessing()) {
                    progressLogger();
                }
            }, 5000);

            progressLogger();
        }
    }

    public logSummary(): void {
        var tickets = this.store.getTickets();
        tickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File);

        var finishedItems = tickets.filter(x => x.state == TicketState.Processed || x.state == TicketState.Skipped || x.state == TicketState.Failed);
        var processedItems = tickets.filter(x => x.state == TicketState.Processed);
        var skippedItems = tickets.filter(x => x.state == TicketState.Skipped);
        var failedItems = tickets.filter(x => x.state == TicketState.Failed);

        var endTime = new Date();
        console.log(
            "Total: " + tickets.length
            + ", Processed: " + processedItems.length
            + ", Skipped: " + skippedItems.length
            + ", Failed: " + failedItems.length
            + ", Time elapsed: " + ((endTime.valueOf() - this.startTime.valueOf()) / 1000) + "secs");

        if (Logger.verbose) {
            console.log("Summary:");
            var pathLengths = finishedItems.map(x => x.artifactItem.path.length);
            var maxPathLength = pathLengths.reduce((a, b) => a > b ? a : b, 1);
            var fileHeader = this.padText("File", maxPathLength);
            var startTimeHeader = this.padText("Start Time", 25);
            var finishTimeHeader = this.padText("Finish Time", 25);
            var durationHeader = this.padText("Duration", 10);
            var stateHeader = this.padText("STATE", 10);

            console.log(this.padText("", maxPathLength + 25 + 25 + 10 + 10 + 15, '-'))
            console.log(`| ${fileHeader} | ${startTimeHeader} | ${finishTimeHeader} | ${durationHeader} | ${stateHeader}|`)
            console.log(this.padText("", maxPathLength + 25 + 25 + 10 + 10 + 15, '-'))
            tickets.forEach(ticket => {
                var duration = (ticket.finishTime.valueOf() - ticket.startTime.valueOf()) / 1000 + " secs";
                console.log("| " + this.padText(ticket.artifactItem.path, maxPathLength) + " | " + this.padText(ticket.startTime.toISOString(), 25) + " | " + this.padText(ticket.finishTime.toISOString(), 25) + " | " + this.padText(duration, 10) + " | " + this.padText(ticket.state.toString().toUpperCase(), 10) + "|");
                console.log(this.padText("", maxPathLength + 25 + 25 + 10 + 10 + 15, '-'))
            });
        }
    }

    private padText(textToPad: string, maxTextLength: number, padChar?: string): string {
        var m = Math.max(maxTextLength - textToPad.length, 0);
        var pad = Array(parseInt("" + m) + 1).join(padChar || ' ');
        var paddedText = textToPad + pad;
        return paddedText;
    }

    public static verbose: boolean;
    private store: ArtifactItemStore;
    private startTime: Date;
}