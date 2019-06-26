import * as React from "react";
import {DataSourceError} from './DataSourceError';
import {DataSourceResultStatus} from './DataSourceResultStatus';
import {DataSourceResult} from './DataSourceResult'
import { ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint";
import { ParseError, ExecuteError } from "../states/DataSourceExtensionState";

type DataSourceExecutionResultProps= {
    result: ServiceEndpointRequestResult | null
    parseError:ParseError|null
    executeError:ExecuteError|null
}

export class DataSourceExecutionResult extends React.Component<DataSourceExecutionResultProps>{
    public render() {
        if(this.props.result!=null){  
            return  (
                <div className="rhythm-vertical-16">
                    <DataSourceResultStatus statusCode={this.props.result.statusCode}/>
                    <DataSourceResult result={this.props.result}/>
                    <DataSourceError result={this.props.result} parseError={this.props.parseError} executeError={this.props.executeError} />
                </div>
            );
        } 
        else{
            return  (
                <div className=" rhythm-vertical-16">
                    <DataSourceError result={this.props.result} parseError={this.props.parseError} executeError={this.props.executeError}/>
                </div>
            );
        }
    }
}