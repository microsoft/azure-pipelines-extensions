import * as Reflux from 'reflux';
import { DataSourcesActions } from '../actions/DataSourcesActions';
import { ServiceEndpointRestClient, ServiceEndpointDetails, ServiceEndpointType, DataSource, DataSourceDetails, ResultTransformationDetails, ServiceEndpointRequest, ServiceEndpointRequestResult, OAuthConfigurationActionFilter } from 'azure-devops-extension-api/ServiceEndpoint';
import { getClient } from 'azure-devops-extension-api/Common';
import { DataSourcesMap, ExecuteServiceEndpointRequestPayload, UpdateDataSourcePayload, UpdateDataSourceParametersPayload, SelectDataSourcePayload, Parameters, ErrorPayload, GetDataSourcesPayload } from '../Models/DataSourcesExtensionModel';

export class DataSourcesActionCreators extends Reflux.Component {
    private static instance: DataSourcesActionCreators;

    static getInstance(): DataSourcesActionCreators {
        if (!DataSourcesActionCreators.instance) {
            DataSourcesActionCreators.instance = new DataSourcesActionCreators(null);
        }
    
        return DataSourcesActionCreators.instance;
      }

    public updateDataSourceParameters(name: string, value: string) {
        let payload: UpdateDataSourceParametersPayload = {
            parameterName: name,
            parameterValue: value,
        };

        DataSourcesActions.UpdateDataSourceParameters(payload);
    }

    public selectDataSource(selectedDataSource: string, dataSourceInfoDisplay: string) {
        let inputParameters: Parameters = this.extractInputParameters(dataSourceInfoDisplay, null);
        let payload: SelectDataSourcePayload = {
            selectedDataSource: selectedDataSource,
            inputParameters: inputParameters,
            dataSourceInfoDisplay: dataSourceInfoDisplay,
        };

        DataSourcesActions.SelectDataSource(payload);
    }

    public updateDataSource(newValue: string, currentInputParameters: Parameters | null) {
        let inputParameters: Parameters = this.extractInputParameters(newValue, currentInputParameters);
        let payload: UpdateDataSourcePayload = {
            inputParameters: inputParameters,
            dataSourceInfoDisplay: newValue
        };

        DataSourcesActions.UpdateDataSource(payload);
    }

    public executeServiceEndpointRequest(dataSourceInfo: string, currentInputParameters: Parameters, serviceEndpointDetails: ServiceEndpointDetails) {        
        let dataSourceDetails: DataSourceDetails | null = null;
        let resultTransformationDetails: ResultTransformationDetails | null = null;
        try 
        {
            dataSourceDetails = this.constructDataSourceDetails(dataSourceInfo, currentInputParameters);
            resultTransformationDetails = this.constructResultTransformationDetails(dataSourceInfo);
        }
        catch (error) 
        {
            let payload: ErrorPayload = {
                parseError: {
                    errorMessage: error.message,
                },
                executeError: null
            };

            DataSourcesActions.Error(payload);
            return;
        }

        let endpointId = this.getEndpointId();
        let project = this.getProject();
        if (endpointId != null && project != null && dataSourceDetails != null && resultTransformationDetails != null) {
            let serviceEndpointRequest: ServiceEndpointRequest = {
                dataSourceDetails: dataSourceDetails,
                resultTransformationDetails: resultTransformationDetails,
                serviceEndpointDetails: serviceEndpointDetails
            };

            let serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
            serviceEndpointRestClient.executeServiceEndpointRequest(serviceEndpointRequest, project, endpointId).then((result: ServiceEndpointRequestResult) => {
                let payload: ExecuteServiceEndpointRequestPayload = {
                    result: result
                };

                DataSourcesActions.ExecuteServiceEndpointRequest(payload);
            }).catch((error) => {
                let payload: ErrorPayload = {
                    parseError: null,
                    executeError: {
                        name: error['name'],
                        status: error['status'],
                        responseSheet: error['responseSheet'],
                        message: error['message']
                    }
                };

                DataSourcesActions.Error(payload);
            });
        }
    }

    public getDataSources() {
        let endpointId = this.getEndpointId();
        let project = this.getProject();
        if (endpointId != null && project != null) {
            let serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
            serviceEndpointRestClient.getServiceEndpointDetails(project, endpointId).then((endpointdetails: ServiceEndpointDetails) => {
                serviceEndpointRestClient.getServiceEndpointTypes(endpointdetails.type).then((typeDetails: ServiceEndpointType[]) => {
                    let data: DataSourcesMap | undefined = undefined;
                    if (typeDetails.length == 1) {
                        data = {};
                        let dataSources: DataSource[] = typeDetails[0].dataSources;                
                        if (dataSources) {
                            for (let key of Object.keys(dataSources)) 
                            {
                                data[dataSources[key].name] = dataSources[key];
                            }    
                        }
                    }

                    let payload: GetDataSourcesPayload = {     
                        dataSourcesMap: data,
                        serviceEndpointDetails: endpointdetails 
                    }
                    DataSourcesActions.GetDataSources(payload);
                });
            });
        }
    }

    private getProject(): string | null {
        let currentUrl = document.referrer;
        let regex_details = /\/\/(.*)\/_settings/;
        let detailsMatch = (currentUrl.match(regex_details));
        let project = null;
        if (detailsMatch != null && detailsMatch.length == 2) {
            let details = detailsMatch[1];
            let projectMatch = (details.split("/"));
            if (projectMatch != null && projectMatch.length == 3) {
                project = projectMatch[2];
            }
        }

        return project;
    }

    private extractInputParameters(datasourceInfo: string, currentParameters: Parameters | null): Parameters {
        let parameters: Parameters = {};
        let dataSourceEndpointUrlKeyValuePair = datasourceInfo.match(/"endpointUrl"\s*:\s*"[^"]*"/g);
        if (dataSourceEndpointUrlKeyValuePair !== null && dataSourceEndpointUrlKeyValuePair.length == 1) {
            let dataSourceEndpointUrlValue = dataSourceEndpointUrlKeyValuePair[0].replace(/^"endpointUrl"\s*:\s*"|"$/g, '');
            let inputParameters = dataSourceEndpointUrlValue.match(/{{+[^}#/.]*}}+/g);
            if (inputParameters !== null) {
                //clean up extra characters from parameters
                inputParameters = inputParameters.map(x => { return x.replace(/^\{+|\}+$/g, '') });
                this.assignOldValuesToExistingParameters(inputParameters, currentParameters, parameters);
            }
        }

        return parameters
    }

    private assignOldValuesToExistingParameters(inputParameters: RegExpMatchArray, currentParameters: Parameters | null, parameters: Parameters) {
        for (let parameter in inputParameters) {
            if (currentParameters != null && currentParameters[inputParameters[parameter]]) {
                parameters[inputParameters[parameter]] = currentParameters[inputParameters[parameter]];
            }
            else {
                parameters[inputParameters[parameter]] = '';
            }
        }
    }

    private getEndpointId(): string | null {
        let currentUrl = document.referrer;
        let regex_endpoint = /resourceId=(.*)/;
        let endpointMatches = (currentUrl.match(regex_endpoint));
        let endpointId = null;
        if (endpointMatches != null && endpointMatches.length == 2) {
            endpointId = endpointMatches[1];
        }

        return endpointId;
    }

    private constructDataSourceDetails(dataSourceInfo: string, currentInputParam: Parameters) {
        let dataSourceInfoParsed = JSON.parse(dataSourceInfo);
        let dataSourceDetails = {
            dataSourceName: '',
            dataSourceUrl: dataSourceInfoParsed.endpointUrl,
            headers: dataSourceInfoParsed.headers,
            initialContextTemplate: dataSourceInfoParsed.initialContextTemplate,
            parameters: currentInputParam,
            requestContent: dataSourceInfoParsed.requestContent,
            requestVerb: dataSourceInfoParsed.requestVerb,
            resourceUrl: dataSourceInfoParsed.resourceUrl,
            resultSelector: dataSourceInfoParsed.resultSelector
        };

        return dataSourceDetails;
    }

    private constructResultTransformationDetails(dataSourceInfo: string) {
        let dataSourceInfoParsed = JSON.parse(dataSourceInfo);
        let resultTransformationDetails = {
            callbackContextTemplate: dataSourceInfoParsed.callbackContextTemplate,
            callbackRequiredTemplate: dataSourceInfoParsed.callbackRequiredTemplate,
            resultTemplate: dataSourceInfoParsed.resultTemplate
        };

        return resultTransformationDetails;
    }
}