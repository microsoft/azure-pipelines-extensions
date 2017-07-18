import * as models from "../Models"
import * as Stream from "stream";
import Readable = Stream.Readable;

export class StubProvider implements models.IArtifactProvider {
    
    async getArtifactItems(): Promise<models.ArtifactItem[]> {
        return [this.getItem(1, 2), this.getItem(2, 1), this.getItem(3, 5), this.getItem(4, 3), this.getItem(5, 4)];
    }

    async getArtifactItem(artifactItem: models.ArtifactItem): Promise<Stream.Stream> {
        console.log(`Downloading ${artifactItem.path}`);
        await this.delay(artifactItem.fileLength * 100);

        const s = new Readable();
        s._read = () => { };
        s.push(`stub content for ${artifactItem.path}`);
        s.push(null);

        console.log(`Finished Downloading ${artifactItem.path}`);
        return s;
    }

    getItem(index: number, length: number): models.ArtifactItem {
        const artifactItem = new models.ArtifactItem();
        artifactItem.path = `path${index}`;
        artifactItem.fileLength = length;

        return artifactItem;
    }

    delay(ms: number): Promise<{}> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}