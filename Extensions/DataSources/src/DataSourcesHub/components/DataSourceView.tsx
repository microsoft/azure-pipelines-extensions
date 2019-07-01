import * as React from "react";
import * as Reflux from "reflux";
import { DataSourcesDropdown } from './DataSourcesDropdown'
import { DataSourceDetails } from './DataSourceDetails'
import { DataSourceInput } from './DataSourceInput'
import { DataSourceExecutionResult } from './DataSourceExecutionResult'
import { DataSourcesStore } from '../stores/DataSourcesStore'
import { SplitterElementPosition, Splitter } from "azure-devops-ui/Splitter";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";

export class DataSourceView extends Reflux.Component {
    store = DataSourcesStore;

    public componentDidMount() {
        let DataSourceActionCreator = DataSourcesActionCreators.getInstance();
        DataSourceActionCreator.getDataSources();
    }

    public render() {
        if (this.state !== null) {
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

    private _getDataSourceContent() {
       return (
            <div className="datasource-content">
                <DataSourcesDropdown dataSourcesMap={this.state.dataSourcesMap} />
                <DataSourceDetails dataSourcesMap={this.state.dataSourcesMap} currentInputParameters={this.state.currentInputParameters} dataSourceInfoDisplay={this.state.dataSourceInfoDisplay} />
                <DataSourceInput dataSourceInfoDisplay={this.state.dataSourceInfoDisplay} currentInputParameters={this.state.currentInputParameters} endpointDetails={this.state.endpointDetails} />
            </div>
        );
    }

    private _getResultContent(): JSX.Element {
       return (
            <div className="result-content">
                <DataSourceExecutionResult result={this.state.result} parseError={this.state.parseError} executeError={this.state.executeError} />
            </div>
        );
    }
}