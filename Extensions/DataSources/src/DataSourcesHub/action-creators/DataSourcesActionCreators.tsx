import * as Reflux from 'reflux';
import { DataSourcesActions } from '../actions/DataSourcesActions';
import { ServiceEndpointRestClient, ServiceEndpointDetails, ServiceEndpointType, DataSource, DataSourceDetails, ResultTransformationDetails, ServiceEndpointRequest, ServiceEndpointRequestResult, OAuthConfigurationActionFilter } from 'azure-devops-extension-api/ServiceEndpoint';
import { getClient } from 'azure-devops-extension-api/Common';
import { DataSourceInfo, ExecuteServiceEndpointRequestPayload, UpdateDataSourcePayload, UpdateDataSourceParametersPayload, SelectDataSourcePayload, Parameters } from '../states/DataSourcesExtensionState';

export class DataSourcesActionCreators extends Reflux.Component {

    public updateDataSourceParameters(name: string, value: string) {
        var payload: UpdateDataSourceParametersPayload = {
            parameterName: name,
            parameterValue: value,
        };
        DataSourcesActions.UpdateDataSourceParameters(payload);
    }

    public selectDataSource(itemtext: string, datasourceInfo: string) {
        var Parameters: Parameters = this.extractParameters(datasourceInfo, null)
        var payload: SelectDataSourcePayload = {
            selectedDataSource: itemtext,
            currentInputParam: Parameters,
            displayInfo: datasourceInfo,
        };
        DataSourcesActions.SelectDataSource(payload);
    }

    public updateDataSource(newValue: string, currentInputParam: Parameters | null) {
        var Parameters: Parameters = this.extractParameters(newValue, currentInputParam);
        var payload: UpdateDataSourcePayload = {
            currentInputParam: Parameters,
            displayInfo: newValue
        };
        DataSourcesActions.UpdateDataSource(payload);
    }

    public executeServiceEndpointRequest(DataSourceInfo: string | null, currentInputParam: Parameters | null, endpointDetails: ServiceEndpointDetails | null) {
        var endpointId = this.getEndpointId();
        var project = this.getProject();
        var serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        var dataSourceDetails: DataSourceDetails | null = null;
        var resultTransformationDetails: ResultTransformationDetails | null = null;
        var serviceEndpointDetails: ServiceEndpointDetails | null = null;
        try {
            if (DataSourceInfo != null && currentInputParam != null && endpointDetails != null) {
                dataSourceDetails = this.constructDataSourceDetails(DataSourceInfo, currentInputParam);
                resultTransformationDetails = this.constructResultTransformationDetails(DataSourceInfo);
                serviceEndpointDetails = endpointDetails;
            }
        }
        catch (error) {
            var payload: ExecuteServiceEndpointRequestPayload = {
                result: null,
                parseError: {
                    errorMessage: error.message,
                },
                executeError: null
            };
            DataSourcesActions.ExecuteServiceEndpointRequest(payload);
        }
        if (endpointId != null && project != null && dataSourceDetails != null && resultTransformationDetails != null && serviceEndpointDetails != null) {
            var serviceEndpointReq: ServiceEndpointRequest = {
                dataSourceDetails: dataSourceDetails,
                resultTransformationDetails: resultTransformationDetails,
                serviceEndpointDetails: serviceEndpointDetails
            };
            serviceEndpointRestClient.executeServiceEndpointRequest(serviceEndpointReq, project, endpointId).then((result: ServiceEndpointRequestResult) => {
                var payload: ExecuteServiceEndpointRequestPayload = {
                    result: result,
                    executeError: null,
                    parseError: null
                };
                DataSourcesActions.ExecuteServiceEndpointRequest(payload);

            }).catch((error) => {
                var payload: ExecuteServiceEndpointRequestPayload = {
                    result: null,
                    parseError: null,
                    executeError: {
                        name: error['name'],
                        status: error['status'],
                        responseSheet: error['responseSheet'],
                        message: error['message']
                    }
                };
                DataSourcesActions.ExecuteServiceEndpointRequest(payload);
            });
        }
    }

    public getDataSources() {
        var endpointId = this.getEndpointId();
        var project = this.getProject();
        var serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        var data: DataSourceInfo = {};
        if (endpointId != null && project != null) {
            serviceEndpointRestClient.getServiceEndpointDetails(project, endpointId).then((endpointdetails: ServiceEndpointDetails) => {
                serviceEndpointRestClient.getServiceEndpointTypes(endpointdetails.type).then((typeDetails: ServiceEndpointType[]) => {
                    if (typeDetails.length == 1) {
                        var dataSources: DataSource[] = typeDetails[0].dataSources;
                        if (dataSources != null && dataSources != undefined) {
                            for (let key of Object.keys(dataSources))
                                data[dataSources[key].name] = dataSources[key];
                        }
                        DataSourcesActions.GetDataSources(data, endpointdetails);
                    }
                    else {
                        DataSourcesActions.GetDataSources(undefined, endpointdetails);
                    }
                });
            });
        }
    }

    private getProject(): string | null {
        var currentUrl = document.referrer;
        var regex_details = /\/\/(.*)\/_settings/;
        var detailsMatch = (currentUrl.match(regex_details));
        var project = null;
        if (detailsMatch != null && detailsMatch.length == 2) {
            var details = detailsMatch[1];
            var projectMatch = (details.split("/"));
            if (projectMatch != null && projectMatch.length == 3) {
                project = projectMatch[2];
            }
        }
        return project;
    }

    private extractParameters(datasourceInfo: string, currentParameters: Parameters | null): Parameters {
        var parameters: Parameters = {};
        var dataSourceEndpointUrlKeyValuePair = datasourceInfo.match(/"endpointUrl"\s*:\s*"[^"]*"/g);
        if (dataSourceEndpointUrlKeyValuePair !== null && dataSourceEndpointUrlKeyValuePair.length==1 ) {
            var dataSourceEndpointUrlValue = dataSourceEndpointUrlKeyValuePair[0].replace(/^"endpointUrl"\s*:\s*"|"$/g, '');
            var inputParameters = dataSourceEndpointUrlValue.match(/{{+[^}#/.]*}}+/g);
            if (inputParameters !== null) {
                //clean up extra characters from parameters
                inputParameters = inputParameters.map(x => { return x.replace(/^\{+|\}+$/g, '') });
                this.assignOldValuesToExistingParameters(inputParameters, currentParameters, parameters);
            }
        }
        return parameters
    }

    private assignOldValuesToExistingParameters(inputParameters: RegExpMatchArray, currentParameters: Parameters | null, parameters: Parameters) {
        for (var parameter in inputParameters) {
            if (currentParameters != null && currentParameters[inputParameters[parameter]]) {
                parameters[inputParameters[parameter]] = currentParameters[inputParameters[parameter]];
            }
            else {
                parameters[inputParameters[parameter]] = '';
            }
        }
    }

    private getEndpointId(): string | null {
        var currentUrl = document.referrer;
        var regex_endpoint = /adminservices\?resourceId=(.*)/;
        var endpointMatches = (currentUrl.match(regex_endpoint));
        var endpointId = null;
        if (endpointMatches != null && endpointMatches.length == 2) {
            endpointId = endpointMatches[1];
        }
        return endpointId
    }

    private constructDataSourceDetails(dataSourceInfo: string, currentInputParam: Parameters) {
        var dataSourceInfoParsed = JSON.parse(dataSourceInfo);
        var dataSourceDetails = {
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
        var dataSourceInfoParsed = JSON.parse(dataSourceInfo);
        var resultTransformationDetails = {
            callbackContextTemplate: dataSourceInfoParsed.callbackContextTemplate,
            callbackRequiredTemplate: dataSourceInfoParsed.callbackRequiredTemplate,
            resultTemplate: dataSourceInfoParsed.resultTemplate
        };
        return resultTransformationDetails;
    }
}