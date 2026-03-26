import {ArtifactItem} from "./artifactItem";
import { ArtifactItemStore } from '../Store/artifactItemStore';

export interface IArtifactProvider {
    artifactItemStore: ArtifactItemStore;
    getRootItems(): Promise<ArtifactItem[]>;
    getArtifactItems(artifactItem: ArtifactItem): Promise<ArtifactItem[]>;
    getArtifactItem(artifactItem: ArtifactItem): Promise<NodeJS.ReadableStream>;
    putArtifactItem(artifactItem: ArtifactItem, stream: NodeJS.ReadableStream): Promise<ArtifactItem>;
    dispose(): void;
}