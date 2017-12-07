import {ArtifactItem} from "./artifactItem";

import {Readable} from "stream";

export interface IArtifactProvider {
    getRootItems(): Promise<ArtifactItem[]>;
    getArtifactItems(artifactItem: ArtifactItem): Promise<ArtifactItem[]>;
    getArtifactItem(artifactItem: ArtifactItem): Promise<NodeJS.ReadableStream>;
    putArtifactItem(artifactItem: ArtifactItem, stream: NodeJS.ReadableStream): Promise<ArtifactItem>;
    dispose(): void;
}