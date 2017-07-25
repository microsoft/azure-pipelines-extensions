import {ArtifactItem} from "./artifactItem"
import {Readable} from "stream";

export interface IArtifactProvider {

    getRootItems(): Promise<ArtifactItem[]>;
    getArtifactItems(artifactItem: ArtifactItem): Promise<ArtifactItem[]>;
    getArtifactItem(artifactItem: ArtifactItem): Promise<Readable>;
}