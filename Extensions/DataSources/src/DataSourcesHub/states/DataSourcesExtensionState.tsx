import { ServiceEndpointDetails, ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";
import * as EndpointDetails from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";

export interface DataSourceInfo {
    [dataSourceName: string]: EndpointDetails.DataSource;
}

export interface Parameters {
    [paramName: string]: string;
}

export interface ParseError {
    errorMessage: string
}

export interface ExecuteError {
    name: string
    status: string
    responseSheet: string
    message: string
}

export interface UpdateDataSourceParametersPayload {
    parameterName: string
    parameterValue: string
}

export interface SelectDataSourcePayload {
    selectedDataSource: string | undefined
    currentInputParam: Parameters | null
    displayInfo: string | null
}

export interface UpdateDataSourcePayload {
    currentInputParam: Parameters | null
    displayInfo: string | null
}

export interface ExecuteServiceEndpointRequestPayload {
    result: ServiceEndpointRequestResult | null
    parseError: ParseError | null
    executeError: ExecuteError | null
}

export interface DatasourcesExtensionState {
    selectedDataSource: string | undefined
    datasourcesInfo: DataSourceInfo | null
    displayInfo: string | null
    currentInputParam: Parameters | null
    endpointDetails: ServiceEndpointDetails | null
    result: ServiceEndpointRequestResult | null
    parseError: ParseError | null
    executeError: ExecuteError | null
}