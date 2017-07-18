export class FetchEngineOptions {
    retryLimit: number = 5;
    retryIntervalInSeconds: number = 5;
    downloadFileTimeoutInMinutes: number = 5;
    parallelDownloadLimit: number = 4;
    downloadPattern: string = '*';
}