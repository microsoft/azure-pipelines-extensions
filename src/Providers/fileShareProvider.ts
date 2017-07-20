import * as models from "../Models"
import * as Stream from "stream";

export class FileShareProvider implements models.IArtifactProvider {
    constructor(droplocation: string) {
        this._droplocation = droplocation;
    }

    getArtifactItems(): Promise<Object[]> {
        throw new Error("Not implemented");
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Stream> {
        throw new Error("Not implemented");
    }

    private _droplocation: string;
}