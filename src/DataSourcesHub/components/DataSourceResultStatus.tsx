import * as React from "react";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { STATUS_CODE } from '../Resources/DataSourcesResources';

type DataSourceResultStatusProps= {
    statusCode:String
}

export class DataSourceResultStatus extends React.Component<DataSourceResultStatusProps>{
    public render() {
        let severityType = MessageCardSeverity.Error;
        if(this.props.statusCode=='200'){
            severityType = MessageCardSeverity.Info;
        };
        return (
            <MessageCard
                className="result-status-self-stretch"
                severity={severityType}
            >
                {STATUS_CODE} {this.props.statusCode}
            </MessageCard>
        );            
    }  
}