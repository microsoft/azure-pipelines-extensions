import * as React from "react";
import * as Reflux from 'reflux';
import {DataSourceError} from './DataSourceError';
import {DataSourceResultStatus} from './DataSourceResultStatus';
import {DataSourceResult} from './DataSourceResult'

export class DataSourceExecutionResult extends Reflux.Component{
    public render() {
        if(this.props.result!=null){  
            return  (
                <div>
                    <DataSourceResultStatus statusCode={this.props.result.statusCode}/>
                    <DataSourceResult result={this.props.result}/>
                    <DataSourceError result={this.props.result} parseError={this.props.parseError} executeError={this.props.executeError} />
                </div>
            );
        } 
        else{
            return  (
                <div>
                    <DataSourceError result={this.props.result} parseError={this.props.parseError} executeError={this.props.executeError}/>
                </div>
            );
        }
    }
}




