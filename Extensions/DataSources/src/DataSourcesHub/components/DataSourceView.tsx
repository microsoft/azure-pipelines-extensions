import * as React from "react";
import * as Reflux from "reflux";
import {DataSourceDropdown} from './DataSourceDropdown'
import {DataSourceDetails} from './DataSourceDetails'
import {DataSourceInput} from './DataSourceInput'
import {DataSourceExecutionResult} from './DataSourceExecutionResult'
import {DataSourceStore} from '../stores/DataSourceStore'
import { SplitterElementPosition, Splitter } from "azure-devops-ui/Splitter";
import { DataSourceActionCreators } from "../action-creators/DataSourceActionCreators";

export class DataSourceView extends Reflux.Component{
    store = DataSourceStore;
       
    componentDidMount() {
        const DataSourceActionCreator = new DataSourceActionCreators({});
        DataSourceActionCreator.getDataSources();
    }
  
    public render() {
        if(this.state!=null){
            return (         
                <div className="containerStyle">
                    <Splitter
                        fixedElement={SplitterElementPosition.Near}
                        initialFixedSize={400}
                        onRenderNearElement={this._getDataSourceContent.bind(this)}
                        onRenderFarElement={this._getResultContent.bind(this)}
                    />
                </div>        
            );
        }
    }

    private _getDataSourceContent(){
        return (
            <div className="flex-self-stretch padding-element rhythm-vertical-16">
                <DataSourceDropdown datasourcesInfo={this.state.datasourcesInfo}/>
                <DataSourceDetails datasourcesInfo={this.state.datasourcesInfo} currentInputParam={this.state.currentInputParam} displayInfo={this.state.displayInfo}/> 
                <DataSourceInput displayInfo={this.state.displayInfo} currentInputParam={this.state.currentInputParam} endpointDetails={this.state.endpointDetails}/>
           </div>
        );           
    }

    private _getResultContent(): JSX.Element {
        return (
            <div className="flex-self-stretch top-padding-element">
                <DataSourceExecutionResult  result={this.state.result} parseError={this.state.parseError} executeError={this.state.executeError}/>
            </div>
        );
    }    
}