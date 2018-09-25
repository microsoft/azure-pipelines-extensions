import { Logger } from './logger';
export class Worker<T> {
    private execute: (item: T) => Promise<void>;
    private getNextItem: () => T;
    private canExit: () => boolean;
    private hasDownloadFailed: () => boolean;

    private id: number;

    constructor(id: number, execute: (item: T) => Promise<void>, getNextItem: () => T, canExit: () => boolean, hasDownloadFailed: () => boolean) {
        this.id = id;
        this.execute = execute;
        this.getNextItem = getNextItem;
        this.canExit = canExit;
        this.hasDownloadFailed = hasDownloadFailed;
    }

    init(): Promise<void> {
        var promise = new Promise<void>((resolve, reject) => {
            this.spawnWorker(resolve, reject);
        });

        return promise;
    }

    spawnWorker(resolve, reject) {
        try {
            if (this.hasDownloadFailed()) {
                Logger.logInfo(`Aborting respawning worker, as download failed for some file(s).`);
                return;
            }
            
            let item = this.getNextItem();
            if (!item && !this.canExit()) {
                Logger.logInfo(`Nothing to process currently, respawing worker ${this.id} after 1 sec.`);
                setTimeout(() => this.spawnWorker(resolve, reject), 1000);
                return;
            }

            if (!item) {
                Logger.logInfo(`Nothing more to process, exiting worker ${this.id}.`);
                resolve();
                return;
            }

            let executePromise = this.execute(item);

            executePromise.then(() => {
                Logger.logInfo(`Nothing to process currently, respawing worker ${this.id} after 1 sec.`);
                this.spawnWorker(resolve, reject);
            }, (reason) => {
                reject(reason);
                return;
            });
        }
        catch (err) {
            reject(err);
        }
    }
}