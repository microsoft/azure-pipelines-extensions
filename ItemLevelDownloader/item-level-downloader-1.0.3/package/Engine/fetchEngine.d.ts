import * as models from '../Models';
import { FetchEngineOptions } from "./fetchEngineOptions";
export declare class FetchEngine {
    fetchItems(artifactProvider: models.IArtifactProvider, targetPath: string, fetchEngineOptions: FetchEngineOptions): Promise<void>;
    downloadArtifactItem(artifactProvider: models.IArtifactProvider, item: models.ArtifactItem, targetItemPath: string, fetchEngineOptions: FetchEngineOptions): Promise<{}>;
    downloadArtifactItemImplementation(artifactProvider: models.IArtifactProvider, item: models.ArtifactItem, targetItemPath: string, fetchEngineOptions: FetchEngineOptions, downloadResolve: any, downloadReject: any, retryCount?: number): Promise<void>;
    private ensureParentFoldersExist(filePath);
    private artifactItemStore;
}
