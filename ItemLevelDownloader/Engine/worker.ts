import { Logger } from './logger';
export class Worker<T> {
    private executionFunc: (item : T) => Promise<void>;
    private getNextItem: () => T;
    private canExit: () => boolean;

    constructor(func: (item : T) => Promise<void>, getNextItem: () => T, canExit: () => boolean) {
        this.executionFunc = func;
        this.getNextItem = getNextItem;
        this.canExit = canExit;
    }

    init(): Promise<void> {
        var promise = new Promise<void>(async (resolve, reject) => {
            await this.spawnWorker(resolve, reject);
        });

        return promise;
    }

    async spawnWorker(resolve, reject) {
        try {
            await this.workerImplementation();
            if (this.canExit()) {
                Logger.logInfo("Exiting worker nothing more to process");
                resolve();
            }
            else {
                // spawn worker after 1 sec to check for items again.
                setTimeout(() => this.spawnWorker(resolve, reject), 1000);
            }
        }
        catch (err) {
            reject(err);
        }
    }
    
    async workerImplementation() {
        while (true) {
            const item = this.getNextItem();
            if (!item) {
                break;
            }

            await this.executionFunc(item);
        }
    }
}