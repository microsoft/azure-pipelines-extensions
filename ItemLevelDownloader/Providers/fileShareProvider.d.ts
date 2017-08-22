import * as models from "../Models";
import * as Stream from "stream";
export declare class FileShareProvider implements models.IArtifactProvider {
    constructor(droplocation: string);
    getRootItems(): Promise<models.ArtifactItem[]>;
    getArtifactItems(): Promise<models.ArtifactItem[]>;
    getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Readable>;
    private _droplocation;
}
