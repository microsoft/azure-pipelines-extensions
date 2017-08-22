import * as stream from 'stream';
import * as models from '../Models';
export declare class WebProvider implements models.IArtifactProvider {
    constructor(rootItemsLocation: any, templateFile: string, username: string, password: string, variables: any);
    getRootItems(): Promise<models.ArtifactItem[]>;
    getArtifactItems(artifactItem: models.ArtifactItem): Promise<models.ArtifactItem[]>;
    getArtifactItem(artifactItem: models.ArtifactItem): Promise<stream.Readable>;
    private getItems(itemsUrl);
    private getRequestHandler(inputUrl);
    private getTemplateFilePath();
    private getRequestOptions(inputUrl);
    private extend(target, ...args);
    private _rootItemsLocation;
    private _templateFile;
    private _username;
    private _password;
    private _variables;
}
