import { ServiceEndpointDetails, ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";
import * as EndpointDetails from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";

export interface DataSourceInfo{
    [dataSourceName :string] : EndpointDetails.DataSource;
} 

export interface ParamInfo{
    [paramName :string] : string;
} 

export interface ParseError{
    errorMessage : string
}

export interface ExecuteError{
    name:string
    status:string
    responseSheet:string
    message : string
}

export interface PayloadForUpdateDataSourceParameters{
    name:string
    value:string
    parseError:ParseError|null
    executeError:ExecuteError|null
    result:ServiceEndpointRequestResult | null
}

export interface PayloadForSelectDataSource{
    selectedDataSource: string | undefined
    currentInputParam: ParamInfo | null
    displayInfo: string | null  
    parseError:ParseError|null
    executeError:ExecuteError|null
    result:ServiceEndpointRequestResult | null
}

export interface PayloadForUpdateDataSource{
    currentInputParam:ParamInfo | null
    result: ServiceEndpointRequestResult | null
    parseError:ParseError|null
    executeError:ExecuteError|null
    displayInfo: string | null  
}

export interface PayloadForExecuteServiceEndpointRequest{
    result: ServiceEndpointRequestResult | null
    parseError:ParseError|null
    executeError:ExecuteError|null
}

export interface DatasourcesExtensionState {
    selectedDataSource:string | undefined
    datasourcesInfo : DataSourceInfo | null 
    displayInfo : string | null
    currentInputParam: ParamInfo | null
    endpointDetails : ServiceEndpointDetails | null
    result: ServiceEndpointRequestResult | null
    parseError : ParseError | null
    executeError:ExecuteError | null
}