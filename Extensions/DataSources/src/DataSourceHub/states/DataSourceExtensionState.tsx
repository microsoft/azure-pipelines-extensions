import { AuthorizationHeader, ServiceEndpointDetails, ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";
import * as EndpointDetails from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";

export interface metadata{
    callbackContextTemplate:string
    callbackRequiredTemplate: string
    resultTemplate:string
    dataSourceName:string
    dataSourceUrl:string
    headers:AuthorizationHeader[]
    initialContextTemplate:string
    parameters:object
    requestContent:string
    requestVerb:string
    resourceUrl	: string
    resultSelector:string
}

export interface payloadInfo{
    [name :string] : any;
}
export interface endpointDataInfo{
    [dataSourceName :string] : EndpointDetails.DataSource;
} 

export interface paramInfo{
    [paramName :string] : string;
} 

export interface parseError{
    errorMessage : string
    errorParsed:string
}

export interface executeError{
    name:string
    status:string
    responseSheet:string
    message : string
}

export interface datasourceExtensionState {
    selectedDataSource:string 
    datasourcesInfo : endpointDataInfo | null
    displayInfo : EndpointDetails.DataSource | null
    currentInputParam: paramInfo | null
    endpointDetails : ServiceEndpointDetails | null
    result: ServiceEndpointRequestResult | null
    parseError : parseError | null
    executeError:executeError | null
}
  
