import * as React from "react";
import { DataSourceError } from './DataSourceError';
import { DataSourceResultStatus } from './DataSourceResultStatus';
import { DataSourceResult } from './DataSourceResult'
import { ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint";
import { ParseError, ExecuteError } from "../Models/DataSourcesExtensionModel";

type DataSourceExecutionResultProps = {
    result: ServiceEndpointRequestResult | null
    parseError: ParseError | null
    executeError: ExecuteError | null
}

export class DataSourceExecutionResult extends React.Component<DataSourceExecutionResultProps>{
    public render(): JSX.Element {
        if (this.props.result !== null) {
            return (
                <div className="result-content">
                    <DataSourceResultStatus statusCode={this.props.result.statusCode} />
                    <DataSourceResult result={this.props.result} />
                    <DataSourceError resultErrorMessage={this.props.result.errorMessage} parseError={this.props.parseError} executeError={this.props.executeError} />
                </div>
            );
        }
        else {
            return (
                <div className="result-content">
                    <DataSourceError resultErrorMessage={null} parseError={this.props.parseError} executeError={this.props.executeError} />
                </div>
            );
        }
    }
}