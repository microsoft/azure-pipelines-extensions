import * as Reflux from 'reflux';
import { DataSourceActions } from '../actions/DataSourceActions';
import { ServiceEndpointRestClient, ServiceEndpointDetails, ServiceEndpointType, DataSource, DataSourceDetails, ResultTransformationDetails, ServiceEndpointRequest, ServiceEndpointRequestResult, OAuthConfigurationActionFilter } from 'azure-devops-extension-api/ServiceEndpoint';
import { getClient } from 'azure-devops-extension-api/Common';
import { endpointDataInfo, payloadInfo, paramInfo } from '../states/DataSourceExtensionState';


export class DataSourceActionCreators extends Reflux.Component {

    public updateDataSourceParameters(payload: payloadInfo) {
        DataSourceActions.UpdateDataSourceParameters(payload)
    }

    public selectDataSource(itemtext: string|undefined, datasourceInfo: string) {
        var Parameters:paramInfo=this.getParameters(datasourceInfo)
        var payload: payloadInfo = {
            selectedDataSource: itemtext,
            currentInputParam: Parameters,
            result: null,
            parseError: null,
            displayInfo: datasourceInfo,
            executeError: null
        };

        DataSourceActions.SelectDataSource(payload);
    }

    public updateDataSource(newValue: string, prevValue: string) {
        try {
            var Parameters:paramInfo=this.getParameters(JSON.parse(newValue))
            var payload: payloadInfo = {
                currentInputParam: Parameters,
                result: null,
                parseError: null,
                executeError: null,
                displayInfo: JSON.parse(newValue)
            };
            DataSourceActions.UpdateDataSource(payload);
        }
        catch (error) {
            var payload: payloadInfo = {
                currentInputParam: null,
                result: null,
                parseError: {
                    errorMessage: error.message,
                    errorParsed: JSON.stringify(newValue, null, 2)
                },
                displayInfo: prevValue,
                executeError: null
            };
            DataSourceActions.UpdateDataSource(payload);
        }
    }

    public executeServiceEndpointRequest(endpointInfo: string, currentInputParam: paramInfo, endpointDetails: ServiceEndpointDetails) {
        var endpointId = this.getEndpointId();
        var project = this.getProject();
        var serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        var dataSourceDetails: DataSourceDetails = this.packDataSourceDetails(endpointInfo,currentInputParam);
        var resultTransformationDetails: ResultTransformationDetails | null = this.packResultTransformationDetails(endpointInfo);
        var serviceEndpointDetails: ServiceEndpointDetails | null = endpointDetails;
        if (dataSourceDetails != null && resultTransformationDetails != null && serviceEndpointDetails != null) {
            var servicendpointreq: ServiceEndpointRequest = {
                dataSourceDetails: dataSourceDetails,
                resultTransformationDetails: resultTransformationDetails,
                serviceEndpointDetails: serviceEndpointDetails
            }
            serviceEndpointRestClient.executeServiceEndpointRequest(servicendpointreq, project, endpointId).then((result: ServiceEndpointRequestResult) => {
                var payload: payloadInfo = {
                    result: result,
                    executeError: null,
                    parseError: null
                }
                DataSourceActions.ExecuteServiceEndpointRequest(payload);

            }).catch((error) => {
                var payload: payloadInfo = {
                    result: null,
                    parseError: null,
                    executeError: {
                        name: error['name'],
                        status: error['status'],
                        responseSheet: error['responseSheet'],
                        message: error['message']
                    }
                }
                DataSourceActions.ExecuteServiceEndpointRequest(payload);
            });
        }
    }

    public getDataSources() {
        var endpointId = this.getEndpointId();
        var project = this.getProject();
        var serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        var data: endpointDataInfo = {}
        serviceEndpointRestClient.getServiceEndpointDetails(project, endpointId).then((endpointdetails: ServiceEndpointDetails) => {
            serviceEndpointRestClient.getServiceEndpointTypes(endpointdetails.type).then((typeDetails: ServiceEndpointType[]) => {
                if (typeDetails.length == 1) {
                    var dataSources: DataSource[] = typeDetails[0].dataSources;
                    if (dataSources != null && dataSources != undefined){
                        for (let key of Object.keys(dataSources))
                            data[dataSources[key].name] = dataSources[key]
                    }
                    var payload: payloadInfo = {
                            datasourcesInfo: data,
                            endpointDetails: endpointdetails
                        }
                    DataSourceActions.GetDataSources(payload);    
                }
                else {
                    var payload: payloadInfo = {
                        datasourcesInfo: undefined,
                        endpointDetails: endpointdetails
                    }
                    DataSourceActions.GetDataSources(payload);
                }
            });
        });
    }

    private getProject(): string {
        var currentUrl = document.referrer;
        var regex_details = /\/\/(.*)\/_settings/;
        var details = (currentUrl.match(regex_details))![1];
        var project = (details.split("/"))![2];
        return project;
    }

    private getParameters(datasourceInfo: string):paramInfo{
        var Parameters: paramInfo = {}
        try{
            var DataSourceDetails = (JSON.parse(JSON.stringify(datasourceInfo, null, 2)));
            var InputParameters: string[] = (DataSourceDetails.endpointUrl).match(/{{+[^}#/.]*}}+/g)
            if (InputParameters != null) {
                 InputParameters = InputParameters.map(x => { return x.replace(/^\{+|\}+$/g, '') });
                for (var parameter in InputParameters) {
                    Parameters[InputParameters[parameter]] = ''
                }
            }
        }
        catch (error){
            console.log(error)
        }
        return Parameters
               
    }
    private getEndpointId(): string {
        var currentUrl = document.referrer;
        var regex_endpoint = /adminservices\?resourceId=(.*)/;
        var endpointId = (currentUrl.match(regex_endpoint))![1];
        return endpointId
    }
    private packDataSourceDetails(endpointInfo:string,currentInputParam: paramInfo):DataSourceDetails{
        var DataSourceDetails = (JSON.parse(JSON.stringify(endpointInfo, null, 2)));
        var dataSourceDetails: DataSourceDetails = {
            dataSourceName: '',
            dataSourceUrl: DataSourceDetails .endpointUrl,
            headers: DataSourceDetails .headers,
            initialContextTemplate: DataSourceDetails .initialContextTemplate,
            parameters: currentInputParam,
            requestContent: DataSourceDetails .requestContent,
            requestVerb: DataSourceDetails .requestVerb,
            resourceUrl: DataSourceDetails .resourceUrl,
            resultSelector: DataSourceDetails .resultSelector
        };
        return dataSourceDetails;
    }

    private packResultTransformationDetails(endpointInfo:string):ResultTransformationDetails | null {
        var DataSourceDetails = (JSON.parse(JSON.stringify(endpointInfo, null, 2)));
        var resultTransformationDetails: ResultTransformationDetails | null = {
            callbackContextTemplate: DataSourceDetails .callbackContextTemplate,
            callbackRequiredTemplate: DataSourceDetails .callbackRequiredTemplate,
            resultTemplate: DataSourceDetails .resultTemplate
        };
        return resultTransformationDetails;
    }

}




