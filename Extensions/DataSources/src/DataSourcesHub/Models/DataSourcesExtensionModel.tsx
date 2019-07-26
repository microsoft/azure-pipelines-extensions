import { ServiceEndpointRequestResult, ServiceEndpointDetails } from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";
import * as EndpointDetails from "azure-devops-extension-api/ServiceEndpoint/ServiceEndpoint";

export interface DataSourcesMap {
    [dataSourceName: string]: EndpointDetails.DataSource;
}

export interface Parameters {
    [paramName: string]: string
}

export interface ParseError {
    errorMessage: string
}

export interface ExecuteError {
    name: string,
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
    inputParameters: Parameters | null
    dataSourceInfoDisplay: string | null
}

export interface UpdateDataSourcePayload {
    inputParameters: Parameters | null
    dataSourceInfoDisplay: string | null
}

export interface ExecuteServiceEndpointRequestPayload {
    result: ServiceEndpointRequestResult | null
}

export interface ErrorPayload {
    parseError: ParseError | null
    executeError: ExecuteError | null
}

export interface GetDataSourcesPayload {
    dataSourcesMap: DataSourcesMap | undefined
    serviceEndpointDetails: ServiceEndpointDetails 
}