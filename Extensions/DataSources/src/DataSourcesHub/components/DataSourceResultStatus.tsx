import * as React from "react";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";

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
                className="flex-self-stretch"
                severity={severityType}
            >
            Status Code : {this.props.statusCode}
            </MessageCard>
        );            
    }  
}