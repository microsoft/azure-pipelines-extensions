import * as React from "react";
import * as Reflux from 'reflux';
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";


export class DataSourceError extends Reflux.Component{
    public render() {
        if( this.props.result!=null && this.props.result.errorMessage!=''){
            return (
                <MessageCard
                    className="flex-self-stretch"
                    severity={MessageCardSeverity.Error}
                >
                {this.props.result.errorMessage}
                </MessageCard>
            );
        }
        else if(this.props.parseError!=null){
                return (
                    <MessageCard
                        className="flex-self-stretch"
                        severity={MessageCardSeverity.Error}
                    >
                        {this.props.parseError.errorMessage}
                    </MessageCard>
                );             
        }
        else if(this.props.executeError!=null){
                return (
                    <MessageCard
                        className="flex-self-stretch"
                        severity={MessageCardSeverity.Error}
                    >
                    {this.props.executeError.name}  <br/>
                    {this.props.executeError.message}
                    </MessageCard>
                );
        }
        else{
            return(null);
        }
    }  
}