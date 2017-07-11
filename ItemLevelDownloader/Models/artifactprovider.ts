import {ArtifactItem} from "./artifactItem"
import {Stream} from "stream";

export interface IArtifactProvider {
    getArtifactItems(): Promise<ArtifactItem[]>;
    getArtifactItem(artifactItem: ArtifactItem): Promise<Stream>;
}