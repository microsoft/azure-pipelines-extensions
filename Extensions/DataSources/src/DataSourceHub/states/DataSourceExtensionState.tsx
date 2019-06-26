import { ServiceEndpointDetails, ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";
import * as EndpointDetails from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";

export interface PayloadInfo{
    [name :string] : any;
}
export interface DataSourceInfo{
    [dataSourceName :string] : EndpointDetails.DataSource;
} 

export interface ParamInfo{
    [paramName :string] : string;
} 

export interface ParseError{
    errorMessage : string
    errorParsed:string
}

export interface ExecuteError{
    name:string
    status:string
    responseSheet:string
    message : string
}

export interface DatasourceExtensionState {
    selectedDataSource:string | undefined
    datasourcesInfo : DataSourceInfo | null 
    displayInfo : EndpointDetails.DataSource | null
    currentInputParam: ParamInfo | null
    endpointDetails : ServiceEndpointDetails | null
    result: ServiceEndpointRequestResult | null
    parseError : ParseError | null
    executeError:ExecuteError | null
}