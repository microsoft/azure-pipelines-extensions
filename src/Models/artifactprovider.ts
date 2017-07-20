import {ArtifactItem} from "./artifactItem"
import {Readable} from "stream";

export interface IArtifactProvider {
    getArtifactItems(): Promise<ArtifactItem[]>;
    getArtifactItem(artifactItem: ArtifactItem): Promise<Readable>;
}