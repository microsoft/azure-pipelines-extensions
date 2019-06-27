import * as Reflux from 'reflux';
import { DataSourcesActions } from '../actions/DataSourcesActions';
import { DatasourcesExtensionState, UpdateDataSourceParametersPayload, SelectDataSourcePayload, UpdateDataSourcePayload, DataSourceInfo, ExecuteServiceEndpointRequestPayload } from '../states/DataSourcesExtensionState';
import { ServiceEndpointDetails } from 'azure-devops-extension-api/ServiceEndpoint';

export const defaultState: DatasourcesExtensionState = {
    selectedDataSource: '',
    datasourcesInfo: null,
    displayInfo: null,
    currentInputParam: null,
    result: null,
    endpointDetails: null,
    parseError: null,
    executeError: null
};

export class DataSourcesStore extends Reflux.Store {
    listenables = DataSourcesActions;
    state: DatasourcesExtensionState = defaultState;

    init() {
        this.listenTo(DataSourcesActions.GetDataSources, this.onGetDataSources);
        this.listenTo(DataSourcesActions.SelectDataSource, this.onSelectDataSource);
        this.listenTo(DataSourcesActions.UpdateDataSource, this.onUpdateDataSource);
        this.listenTo(DataSourcesActions.UpdateDataSourceParameters, this.onUpdateDataSourceParameters);
        this.listenTo(DataSourcesActions.ExecuteServiceEndpointRequest, this.onExecuteServiceEndpointRequest);
    }

    private onGetDataSources(datasourcesInfo: DataSourceInfo, endpointDetails: ServiceEndpointDetails) {
        this.setState({
            datasourcesInfo: datasourcesInfo,
            endpointDetails: endpointDetails
        });
    }

    private onSelectDataSource(payload: SelectDataSourcePayload) {
        this.setState({
            selectedDataSource: payload.selectedDataSource,
            currentInputParam: payload.currentInputParam,
            displayInfo: payload.displayInfo,
            parseError: null,
            executeError: null,
            result: null,

        });
    }

    private onUpdateDataSourceParameters(payload: UpdateDataSourceParametersPayload) {
        this.setState({
            currentInputParam: { ...this.state.currentInputParam, [payload.parameterName]: payload.parameterValue },
            parseError: null,
            executeError: null,
            result: null,
        });
    }


    private onUpdateDataSource(payload: UpdateDataSourcePayload) {
        this.setState({
            currentInputParam: payload.currentInputParam,
            displayInfo:payload.displayInfo,
            result: null,
            parseError: null,
            executeError: null,
        });
    }

    private onExecuteServiceEndpointRequest(payload: ExecuteServiceEndpointRequestPayload) {
        this.setState({
            result: payload.result,
            executeError: payload.executeError,
            parseError: payload.parseError
        });
    }
};