import * as React from "react";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint";
import { ParseError, ExecuteError } from "../states/DataSourcesExtensionState";

type DataSourceErrorProps = {
    result: ServiceEndpointRequestResult | null
    parseError: ParseError | null
    executeError: ExecuteError | null
}

export class DataSourceError extends React.Component<DataSourceErrorProps>{
    public render() {
        if (this.props.result != null && this.props.result.errorMessage != '') {
            return (
                <MessageCard
                    className="error-message"
                    severity={MessageCardSeverity.Error}
                >
                    {this.props.result.errorMessage}
                </MessageCard>
            );
        }
        else if (this.props.parseError != null) {
            return (
                <MessageCard
                    className="error-message"
                    severity={MessageCardSeverity.Error}
                >
                    {this.props.parseError.errorMessage}
                </MessageCard>
            );
        }
        else if (this.props.executeError != null) {
            return (
                <MessageCard
                    className="error-message"
                    severity={MessageCardSeverity.Error}
                >
                    {this.props.executeError.name}  <br />
                    {this.props.executeError.message}
                </MessageCard>
            );
        }
        else {
            return (null);
        }
    }
}