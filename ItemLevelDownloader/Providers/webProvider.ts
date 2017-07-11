import * as models from "../Models"
import * as Stream from "stream";

export class WebProvider implements models.IArtifactProvider {
    constructor(itemsUrl: string) {
        this._itemsUrl = itemsUrl;
    }

    getArtifactItems(): Promise<Object[]> {
        throw new Error("Not implemented");
    }

    getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Stream> {
        throw new Error("Not implemented");
    }

    private _itemsUrl: string;
}