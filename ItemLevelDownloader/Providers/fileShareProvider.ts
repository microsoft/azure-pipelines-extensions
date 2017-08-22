import * as models from "../Models"
import * as Stream from "stream";

export class FileShareProvider implements models.IArtifactProvider {
    constructor(droplocation: string) {
        this._droplocation = droplocation;
    }

    getRootItems(): Promise<models.ArtifactItem[]> {
        throw new Error("Method not implemented.");
    }

    getArtifactItems(): Promise<models.ArtifactItem[]> {
        throw new Error("Not implemented");
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Readable> {
        throw new Error("Not implemented");
    }

    putArtifactItem(item: models.ArtifactItem, readStream: Stream.Readable): Promise<models.ArtifactItem> {
        throw new Error("Not implemented");
    }

    private _droplocation: string;
}
