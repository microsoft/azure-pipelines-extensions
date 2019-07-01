import * as React from "react";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint";
import { ParseError, ExecuteError } from "../Models/DataSourcesExtensionModel";

type DataSourceErrorProps = {
    resultErrorMessage: string | null
    parseError: ParseError | null
    executeError: ExecuteError | null
}

export class DataSourceError extends React.Component<DataSourceErrorProps>{
    public render(): JSX.Element {
        let message: string = "";
        let name: string = "";
        if (this.props.resultErrorMessage != null) {
            message = this.props.resultErrorMessage;
        }
        else if (this.props.parseError != null) {
            message = this.props.parseError.errorMessage;
        }
        else if (this.props.executeError != null) {
            name = this.props.executeError.name;
            message = this.props.executeError.message;
        }

        if (message !== "") {
            return (
            <MessageCard
                className="error-message"
                severity={MessageCardSeverity.Error}>
                {name}
                {message}
            </MessageCard>);
        }
        else {
            return (<div />);
        }
    }
}