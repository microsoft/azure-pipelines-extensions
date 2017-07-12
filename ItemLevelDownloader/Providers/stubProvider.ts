import * as models from "../Models"
import * as Stream from "stream";

export class StubProvider implements models.IArtifactProvider {
    
    async getArtifactItems(): Promise<models.ArtifactItem[]> {
        return [this.getItem(1, 2), this.getItem(2, 1), this.getItem(3, 4), this.getItem(4, 3)];
    }

    async getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Stream> {
        console.log("Downloading " + artifactItem.path);
        await this.delay(artifactItem.fileLength * 100);
        console.log("Finished Downloading " + artifactItem.path);
        return null;
    }

    getItem(index: number, length: number): models.ArtifactItem {
        let artifactItem = new models.ArtifactItem();
        artifactItem.path = "path" + index;
        artifactItem.fileLength = length;
        return artifactItem;
    }

    delay(ms: number): Promise<{}> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}