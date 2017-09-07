export class ArtifactEngineOptions {
    retryLimit: number = 5;
    retryIntervalInSeconds: number = 5;
    fileProcessingTimeoutInMinutes: number = 5;
    parallelProcessingLimit: number = 4;
    itemPattern: string = '**';
    verbose: boolean = false;
}