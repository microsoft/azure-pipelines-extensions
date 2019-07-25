import * as Reflux from 'reflux';
import { DataSourcesActions } from '../actions/DataSourcesActions';
import { Parameters, ParseError, ExecuteError, UpdateDataSourceParametersPayload, SelectDataSourcePayload, UpdateDataSourcePayload, DataSourcesMap, ExecuteServiceEndpointRequestPayload, ErrorPayload, GetDataSourcesPayload } from '../Models/DataSourcesExtensionModel';
import { ServiceEndpointDetails, ServiceEndpointRequestResult } from 'azure-devops-extension-api/ServiceEndpoint';

export interface DatasourcesExtensionState {
    selectedDataSource: string | undefined
    dataSourcesMap: DataSourcesMap | null
    dataSourceInfoDisplay: string | null
    currentInputParameters: Parameters | null
    endpointDetails: ServiceEndpointDetails | null
    result: ServiceEndpointRequestResult | null
    parseError: ParseError | null
    executeError: ExecuteError | null
}

export class DataSourcesStore extends Reflux.Store {
    listenables = DataSourcesActions;
    state: DatasourcesExtensionState = { 
        selectedDataSource: '',
        dataSourcesMap: null,
        dataSourceInfoDisplay: null,
        currentInputParameters: null,
        result: null,
        endpointDetails: null,
        parseError: null,
        executeError: null
    };

    public init() {
        this.listenTo(DataSourcesActions.GetDataSources, this.onGetDataSources);
        this.listenTo(DataSourcesActions.SelectDataSource, this.onSelectDataSource);
        this.listenTo(DataSourcesActions.UpdateDataSource, this.onUpdateDataSource);
        this.listenTo(DataSourcesActions.UpdateDataSourceParameters, this.onUpdateDataSourceParameters);
        this.listenTo(DataSourcesActions.ExecuteServiceEndpointRequest, this.onExecuteServiceEndpointRequest);
        this.listenTo(DataSourcesActions.Error, this.onError);
    }

    private onGetDataSources(payload: GetDataSourcesPayload) {
        this.setState({
            dataSourcesMap: payload.dataSourcesMap,
            endpointDetails: payload.serviceEndpointDetails
        });
    }

    private onSelectDataSource(payload: SelectDataSourcePayload) {
        this.setState({
            selectedDataSource: payload.selectedDataSource,
           currentInputParameters: payload.inputParameters,
            dataSourceInfoDisplay: payload.dataSourceInfoDisplay,
            parseError: null,
            executeError: null,
            result: null
        });
    }

    private onUpdateDataSourceParameters(payload: UpdateDataSourceParametersPayload) {
        this.setState({
            currentInputParameters: { ...this.state.currentInputParameters, [payload.parameterName]: payload.parameterValue },
            parseError: null,
            executeError: null,
            result: null
        });
    }

    private onUpdateDataSource(payload: UpdateDataSourcePayload) {
        this.setState({
            currentInputParameters: payload.inputParameters,
            dataSourceInfoDisplay:payload.dataSourceInfoDisplay,
            result: null,
            parseError: null,
            executeError: null,
        });
    }

    private onExecuteServiceEndpointRequest(payload: ExecuteServiceEndpointRequestPayload) {
        this.setState({
            result: payload.result,
            executeError: null,
            parseError: null
        });
    }

    private onError(payload: ErrorPayload) {
        this.setState({
            result: null,
            executeError: payload.executeError,
            parseError: payload.parseError
        });
    }
};