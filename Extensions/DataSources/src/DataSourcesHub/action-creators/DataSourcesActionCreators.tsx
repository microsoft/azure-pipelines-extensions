import * as Reflux from 'reflux';
import { DataSourcesActions } from '../actions/DataSourcesActions';
import { ServiceEndpointRestClient, ServiceEndpointDetails, ServiceEndpointType, DataSource, DataSourceDetails, ResultTransformationDetails, ServiceEndpointRequest, ServiceEndpointRequestResult, OAuthConfigurationActionFilter } from 'azure-devops-extension-api/ServiceEndpoint';
import { getClient } from 'azure-devops-extension-api/Common';
import { DataSourceInfo,PayloadForExecuteServiceEndpointRequest,PayloadForUpdateDataSource, PayloadForUpdateDataSourceParameters, PayloadForSelectDataSource, ParamInfo } from '../states/DataSourcesExtensionState';

export class DataSourcesActionCreators extends Reflux.Component{

    public updateDataSourceParameters(name:string,value:string) {
        var payload:PayloadForUpdateDataSourceParameters = {
            name:name,
            value:value,
            parseError:null,
            executeError:null,
            result:null,
        };       
        DataSourcesActions.UpdateDataSourceParameters(payload)
    }

    public selectDataSource(itemtext: string, datasourceInfo: string) {
        var Parameters:ParamInfo=this.extractParameters(datasourceInfo,null)
        var payload:PayloadForSelectDataSource = {
            selectedDataSource: itemtext,
            currentInputParam: Parameters,
            result: null,
            parseError: null,
            displayInfo: datasourceInfo,
            executeError: null
        };
        DataSourcesActions.SelectDataSource(payload);
    }

    public updateDataSource(newValue: string,currentInputParam:ParamInfo | null) {
        var Parameters:ParamInfo=this.extractParameters(newValue,currentInputParam)
        var payload: PayloadForUpdateDataSource = {
                currentInputParam: Parameters,
                result: null,
                parseError: null,
                executeError: null,
                displayInfo: newValue
        };
        DataSourcesActions.UpdateDataSource(payload);
    }

    public executeServiceEndpointRequest(DataSourceInfo: string|null, currentInputParam: ParamInfo|null, endpointDetails: ServiceEndpointDetails|null) {
        var endpointId = this.getEndpointId();
        var project = this.getProject();
        var serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        var dataSourceDetails: DataSourceDetails|null=null;
        var resultTransformationDetails: ResultTransformationDetails | null =null;
        var serviceEndpointDetails: ServiceEndpointDetails | null = null;
        try{
            if(DataSourceInfo!=null && currentInputParam!=null && endpointDetails!=null){
                dataSourceDetails= this.constructDataSourceDetails(DataSourceInfo,currentInputParam);
                resultTransformationDetails= this.constructResultTransformationDetails(DataSourceInfo);  
                serviceEndpointDetails= endpointDetails;  
            } 
        }
        catch(error){
            var payload: PayloadForExecuteServiceEndpointRequest = {
                        result: null,
                        parseError: {
                            errorMessage: error.message,
                        },
                        executeError: null
                }
            DataSourcesActions.ExecuteServiceEndpointRequest(payload);
        }
        if (endpointId!=null && project!=null && dataSourceDetails != null && resultTransformationDetails != null && serviceEndpointDetails!= null) {
            var serviceEndpointReq: ServiceEndpointRequest = {
                dataSourceDetails: dataSourceDetails,
                resultTransformationDetails: resultTransformationDetails,
                serviceEndpointDetails: serviceEndpointDetails
            }
            serviceEndpointRestClient.executeServiceEndpointRequest(serviceEndpointReq, project, endpointId).then((result: ServiceEndpointRequestResult) => {
                var payload: PayloadForExecuteServiceEndpointRequest = {
                    result: result,
                    executeError: null,
                    parseError: null
                }
                DataSourcesActions.ExecuteServiceEndpointRequest(payload);

            }).catch((error) => {
                var payload: PayloadForExecuteServiceEndpointRequest = {
                    result: null,
                    parseError: null,
                    executeError: {
                        name: error['name'],
                        status: error['status'],
                        responseSheet: error['responseSheet'],
                        message: error['message']
                    }
                }
                DataSourcesActions.ExecuteServiceEndpointRequest(payload);
            });
        }
    }

    public getDataSources() {
        var endpointId = this.getEndpointId();
        var project = this.getProject();
        var serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        var data: DataSourceInfo = {}
        if(endpointId!=null && project!=null){
            serviceEndpointRestClient.getServiceEndpointDetails(project, endpointId).then((endpointdetails: ServiceEndpointDetails) => {
                serviceEndpointRestClient.getServiceEndpointTypes(endpointdetails.type).then((typeDetails: ServiceEndpointType[]) => {
                    if (typeDetails.length == 1) {
                        var dataSources: DataSource[] = typeDetails[0].dataSources;
                        if (dataSources != null && dataSources != undefined){
                            for (let key of Object.keys(dataSources))
                                data[dataSources[key].name] = dataSources[key]
                        }
                        DataSourcesActions.GetDataSources(data,endpointdetails);    
                    }
                    else{
                        DataSourcesActions.GetDataSources(undefined,endpointdetails);
                    }
                });
            });
        }  
    }

    private getProject(): string| null {
        var currentUrl = document.referrer;
        var regex_details = /\/\/(.*)\/_settings/;
        var detailsMatch = (currentUrl.match(regex_details));
        var project=null;
        if(detailsMatch!=null && detailsMatch.length==2){
            var details=detailsMatch[1];
            var projectMatch = (details.split("/"));
            if(projectMatch!=null && projectMatch.length==3){
                      project=projectMatch[2]
            }
        }
        return project;
    }

    private extractParameters(datasourceInfo: string,currentInputParam:ParamInfo | null):ParamInfo{
        var Parameters: ParamInfo = {}
        var DataSourceDetails = datasourceInfo.match(/"endpointUrl"\s*:\s*"[^"]*"/g);
        if(DataSourceDetails!=null){
                var endpointUrl= DataSourceDetails[0].replace(/^"endpointUrl"\s*:\s*"|"$/g, '')
                var InputParameters= endpointUrl.match(/{{+[^}#/.]*}}+/g)
                if (InputParameters != null) {
                    InputParameters = InputParameters.map(x => { return x.replace(/^\{+|\}+$/g, '') });
                    for (var parameter in InputParameters) {
                        if(currentInputParam!=null && currentInputParam[InputParameters[parameter]]){
                            Parameters[InputParameters[parameter]] = currentInputParam[InputParameters[parameter]]
                        }
                        else{
                            Parameters[InputParameters[parameter]] = ''
                        }
                    }
                }
        }
        return Parameters           
    }

    private getEndpointId(): string|null {
        var currentUrl = document.referrer;
        var regex_endpoint = /adminservices\?resourceId=(.*)/;
        var endpointMatches = (currentUrl.match(regex_endpoint));
        var endpointId =null;
        if(endpointMatches!=null && endpointMatches.length==2){
            endpointId=endpointMatches[1]
        }
        return endpointId
    }
    
    private constructDataSourceDetails(dataSourceInfo:string,currentInputParam: ParamInfo){
        var DataSourceInfoParsed=JSON.parse(dataSourceInfo)
        var dataSourceDetails = {
            dataSourceName: '',
            dataSourceUrl: DataSourceInfoParsed.endpointUrl,
            headers: DataSourceInfoParsed.headers,
            initialContextTemplate: DataSourceInfoParsed.initialContextTemplate,
            parameters: currentInputParam,
            requestContent: DataSourceInfoParsed.requestContent,
            requestVerb: DataSourceInfoParsed.requestVerb,
            resourceUrl: DataSourceInfoParsed.resourceUrl,
            resultSelector:DataSourceInfoParsed.resultSelector
        };
        return dataSourceDetails;
    }

    private constructResultTransformationDetails(dataSourceInfo:string){
        var DataSourceInfoParsed=JSON.parse(dataSourceInfo)
        var resultTransformationDetails= {
            callbackContextTemplate: DataSourceInfoParsed.callbackContextTemplate,
            callbackRequiredTemplate: DataSourceInfoParsed.callbackRequiredTemplate,
            resultTemplate: DataSourceInfoParsed.resultTemplate
        };
        return resultTransformationDetails;
    }
}