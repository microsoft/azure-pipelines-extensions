import * as React from "react";
import * as Reflux from 'reflux';
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";

export class DataSourceResultStatus extends Reflux.Component{
    public render() {
        if(this.props.statusCode=='200'){
            return (
                <MessageCard
                    className="flex-self-stretch"
                    severity={MessageCardSeverity.Info}
                >
                Status Code : {this.props.statusCode}
                </MessageCard>
            );
        }
        else{
            return (
                <MessageCard
                    className="flex-self-stretch"
                    severity={MessageCardSeverity.Error}
                >
                Status Code : {this.props.statusCode}
                </MessageCard>
            );
        }      
    }  
}