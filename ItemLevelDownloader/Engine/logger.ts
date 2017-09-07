import { ItemType } from '../Models';
import { TicketState } from '../Models/ticketState';
import { ArtifactItemStore } from '../Store/artifactItemStore';

export class Logger {

    constructor(verbose: boolean) {
        this.verbose = verbose
    }

    public logInfo(message: string) {
        if (this.verbose) {
            console.info(message);
        }
    }

    public logError(message: string) {
        console.error(message);
    }

    public logMessage(message: string) {
        console.log(message);
    }

    public logSummary(store: ArtifactItemStore): void {
        var tickets = store.getTickets();
        tickets = tickets.filter(x => x.artifactItem.itemType == ItemType.File);

        var processedItems = tickets.filter(x => x.state == TicketState.Processed);
        var queuedItems = tickets.filter(x => x.state == TicketState.InQueue);
        var skippedItems = tickets.filter(x => x.state == TicketState.Skipped);
        var failedItems = tickets.filter(x => x.state == TicketState.Failed);

        console.log(
            "Total: " + tickets.length
            + ", Processed: " + processedItems.length
            + ", Queued: " + queuedItems.length
            + ", Skipped: " + skippedItems.length
            + ", Failed: " + failedItems.length);
        
        if (this.verbose) {
            console.log("Summary:");
            var maxPathLength = processedItems.reduce((a, b) => a.artifactItem.path.length > b.artifactItem.path.length ? a : b).artifactItem.path.length;
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

    private verbose: boolean;
}