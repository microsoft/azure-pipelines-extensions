import * as SDK from 'azure-devops-extension-sdk';
import * as Release from 'azure-devops-extension-api/Release';
import { 
    ServiceEndpointRestClient, 
    DataSourceDetails, 
    ResultTransformationDetails, 
    ServiceEndpointRequest, 
    ServiceEndpointRequestResult } from 'azure-devops-extension-api/ServiceEndpoint';
import { CommonServiceIds, getClient, IProjectPageService } from 'azure-devops-extension-api';
import { ReleaseRestClient } from 'azure-devops-extension-api/Release';

export default class ExpRestClient {
    public async getRelease(releaseId) {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        
        let releaseClient = getClient(ReleaseRestClient);
        let release: Release.Release = await releaseClient.getRelease(project.id, releaseId);
        
        console.log(release);
        return release;
    }

    public async getProgression(serviceConnectionId: string, featureId: string, progressionId: string) {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();

        let dataSourceDetails: DataSourceDetails = {
            dataSourceName: "ExpGetProgression",
            dataSourceUrl: null, 
            headers: null,
            requestContent: null,
            requestVerb: null,
            resourceUrl: null,
            parameters: {
                'FeatureId': featureId,
                'ProgressionId': progressionId
            },
            resultSelector: "",
            initialContextTemplate: ""
        };

        let resultTransformationDetails: ResultTransformationDetails = {
            resultTemplate: "",
            callbackContextTemplate: "",
            callbackRequiredTemplate: ""
        };

        let serviceEndpointRequest: ServiceEndpointRequest = {
            dataSourceDetails: dataSourceDetails,
            resultTransformationDetails: resultTransformationDetails,
            serviceEndpointDetails: null
        };

        let serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        let result: ServiceEndpointRequestResult = await serviceEndpointRestClient.executeServiceEndpointRequest(serviceEndpointRequest, project.id, serviceConnectionId);

        if (parseInt(result.statusCode) == 200) {
            return JSON.parse(result.result[0]);
        }
        else {
            throw new Error(`Unable to find progression with id ${progressionId} in feature ${featureId}. ${result.errorMessage}`);
        }
    }
}