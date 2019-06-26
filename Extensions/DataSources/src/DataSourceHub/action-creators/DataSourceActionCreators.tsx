import * as Reflux from 'reflux';
import { DataSourceActions } from '../actions/DataSourceActions';
import { ServiceEndpointRestClient, ServiceEndpointDetails, ServiceEndpointType, DataSource, DataSourceDetails, ResultTransformationDetails, ServiceEndpointRequest, ServiceEndpointRequestResult, OAuthConfigurationActionFilter } from 'azure-devops-extension-api/ServiceEndpoint';
import { getClient } from 'azure-devops-extension-api/Common';
import { DataSourceInfo, PayloadInfo, ParamInfo } from '../states/DataSourceExtensionState';


export class DataSourceActionCreators extends Reflux.Component {

    public updateDataSourceParameters(payload: PayloadInfo) {
        payload.parseError=null;
        payload.executeError= null;
        payload.result= null;
        DataSourceActions.UpdateDataSourceParameters(payload)
    }

    public selectDataSource(itemtext: string|undefined, datasourceInfo: string) {
        var Parameters:ParamInfo=this.getParameters(datasourceInfo,null)
        var payload:PayloadInfo = {
            selectedDataSource: itemtext,
            currentInputParam: Parameters,
            result: null,
            parseError: null,
            displayInfo: datasourceInfo,
            executeError: null
        };

        DataSourceActions.SelectDataSource(payload);
    }

    public updateDataSource(newValue: string,currentInputParam:ParamInfo | null) {
        var Parameters:ParamInfo=this.getParameters(newValue,currentInputParam)
        var payload: PayloadInfo = {
                currentInputParam: Parameters,
                result: null,
                parseError: null,
                executeError: null,
                displayInfo: newValue
        };
        DataSourceActions.UpdateDataSource(payload);
    }

    public executeServiceEndpointRequest(DataSourceInfo: string, currentInputParam: ParamInfo, endpointDetails: ServiceEndpointDetails) {
        var endpointId = this.getEndpointId();
        var project = this.getProject();
        var serviceEndpointRestClient = getClient(ServiceEndpointRestClient);
        var dataSourceDetails: DataSourceDetails|null=null;
        var resultTransformationDetails: ResultTransformationDetails | null =null;
        var serviceEndpointDetails: ServiceEndpointDetails | null = endpointDetails;
        try{
            dataSourceDetails= this.packDataSourceDetails(DataSourceInfo,currentInputParam);
            resultTransformationDetails= this.packResultTransformationDetails(DataSourceInfo);    
        }
        catch(error){
            var payload: PayloadInfo = {
                        currentInputParam: null,
                        result: null,
                        parseError: {
                            errorMessage: error.message
                        },
                        executeError: null
                }
            DataSourceActions.ExecuteServiceEndpointRequest(payload);
        }
        if (endpointId!=null && project!=null && dataSourceDetails != null && resultTransformationDetails != null && serviceEndpointDetails != null) {
            var servicendpointreq: ServiceEndpointRequest = {
                dataSourceDetails: dataSourceDetails,
                resultTransformationDetails: resultTransformationDetails,
                serviceEndpointDetails: serviceEndpointDetails
            }
            serviceEndpointRestClient.executeServiceEndpointRequest(servicendpointreq, project, endpointId).then((result: ServiceEndpointRequestResult) => {
                var payload: PayloadInfo = {
                    result: result,
                    executeError: null,
                    parseError: null
                }
                DataSourceActions.ExecuteServiceEndpointRequest(payload);

            }).catch((error) => {
                var payload: PayloadInfo = {
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
        var data: DataSourceInfo = {}
        if(endpointId!=null && project!=null)
        {
            serviceEndpointRestClient.getServiceEndpointDetails(project, endpointId).then((endpointdetails: ServiceEndpointDetails) => {
                serviceEndpointRestClient.getServiceEndpointTypes(endpointdetails.type).then((typeDetails: ServiceEndpointType[]) => {
                    if (typeDetails.length == 1) {
                        var dataSources: DataSource[] = typeDetails[0].dataSources;
                        if (dataSources != null && dataSources != undefined){
                            for (let key of Object.keys(dataSources))
                                data[dataSources[key].name] = dataSources[key]
                        }
                        var payload: PayloadInfo = {
                                datasourcesInfo: data,
                                endpointDetails: endpointdetails
                            }
                        DataSourceActions.GetDataSources(payload);    
                    }
                    else {
                        var payload: PayloadInfo = {
                            datasourcesInfo: undefined,
                            endpointDetails: endpointdetails
                        }
                        DataSourceActions.GetDataSources(payload);
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
        if(detailsMatch!=null && detailsMatch.length==2)
        {
            var details=detailsMatch[1];
            var projectMatch = (details.split("/"));
            if(projectMatch!=null && projectMatch.length==3){
                      project=projectMatch[2]
            }
        }
        
        return project;
    }

    private getParameters(datasourceInfo: string,currentInputParam:ParamInfo | null):ParamInfo{
        var Parameters: ParamInfo = {}
        var DataSourceDetails = datasourceInfo.match(/"endpointUrl"\s*:\s*"[^"]*"/g);
        if(DataSourceDetails!=null)
            {
                var endpointUrl= DataSourceDetails[0].replace(/^"endpointUrl"\s*:\s*"|"$/g, '')
                var InputParameters= endpointUrl.match(/{{+[^}#/.]*}}+/g)
                if (InputParameters != null) {
                 InputParameters = InputParameters.map(x => { return x.replace(/^\{+|\}+$/g, '') });
                for (var parameter in InputParameters) {
                    if(currentInputParam!=null && currentInputParam[InputParameters[parameter]])
                    {
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
        if(endpointMatches!=null && endpointMatches.length==2)
        {
            endpointId=endpointMatches[1]
        }
        return endpointId
    }
    
    private packDataSourceDetails(dataSourceInfo:string,currentInputParam: ParamInfo){
        var DataSourceDetails=JSON.parse(dataSourceInfo)
        var dataSourceDetails = {
            dataSourceName: '',
            dataSourceUrl: DataSourceDetails.endpointUrl,
            headers: DataSourceDetails.headers,
            initialContextTemplate: DataSourceDetails.initialContextTemplate,
            parameters: currentInputParam,
            requestContent: DataSourceDetails.requestContent,
            requestVerb: DataSourceDetails.requestVerb,
            resourceUrl: DataSourceDetails.resourceUrl,
            resultSelector: DataSourceDetails.resultSelector
        };
        return dataSourceDetails;
    }

    private packResultTransformationDetails(dataSourceInfo:string){
        var DataSourceDetails=JSON.parse(dataSourceInfo)
        var resultTransformationDetails= {
            callbackContextTemplate: DataSourceDetails.callbackContextTemplate,
            callbackRequiredTemplate: DataSourceDetails.callbackRequiredTemplate,
            resultTemplate: DataSourceDetails.resultTemplate
        };
        return resultTransformationDetails;
    }

}