import * as React from "react";
import * as Reflux from "reflux";
import {DataSourcesDropdown} from './DataSourcesDropdown'
import {DataSourceDetails} from './DataSourceDetails'
import {DataSourceInput} from './DataSourceInput'
import {DataSourceExecutionResult} from './DataSourceExecutionResult'
import {DataSourcesStore} from '../stores/DataSourcesStore'
import { SplitterElementPosition, Splitter } from "azure-devops-ui/Splitter";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";

export class DataSourceView extends Reflux.Component{
    store = DataSourcesStore;
       
    componentDidMount() {
        let DataSourceActionCreator = new DataSourcesActionCreators(null);
        DataSourceActionCreator.getDataSources();
    }
  
    public render() {
        if(this.state!=null){
            return (         
                <div className="datasources-container">
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
            <div className="datasource-content-self-stretch datasource-content-padding datasource-content-vertical-spacing-16">
                <DataSourcesDropdown datasourcesInfo={this.state.datasourcesInfo}/>
                <DataSourceDetails datasourcesInfo={this.state.datasourcesInfo} currentInputParam={this.state.currentInputParam} displayInfo={this.state.displayInfo}/> 
                <DataSourceInput displayInfo={this.state.displayInfo} currentInputParam={this.state.currentInputParam} endpointDetails={this.state.endpointDetails}/>
           </div>
        );           
    }

    private _getResultContent(): JSX.Element {
        return (
            <div className="result-content-self-stretch result-content-padding-element">
                <DataSourceExecutionResult  result={this.state.result} parseError={this.state.parseError} executeError={this.state.executeError}/>
            </div>
        );
    }    
}