import * as Reflux from 'reflux';
import {DataSourceActions} from '../actions/DataSourceActions';
import { datasourceExtensionState,payloadInfo } from '../states/DataSourceExtensionState';

export const defaultState: datasourceExtensionState = {
    selectedDataSource:'',
    datasourcesInfo : null,
    displayInfo : null,
    currentInputParam:null,
    result:null,
    endpointDetails :null,
    parseError :null,
    executeError :null   
}

export class DataSourceStore extends Reflux.Store {
    listenables = DataSourceActions;
    state:datasourceExtensionState = defaultState;
  
    init() {
        this.listenTo(DataSourceActions.GetDataSources, this.onGetDataSources);
        this.listenTo(DataSourceActions.SelectDataSource,this.onSelectDataSource);
        this.listenTo(DataSourceActions.UpdateDataSource,this.onUpdateDataSource);
        this.listenTo(DataSourceActions.UpdateDataSourceParameters,this.onUpdateDataSourceParameters);
        this.listenTo(DataSourceActions.ExecuteServiceEndpointRequest,this.onExecuteServiceEndpointRequest);
    }   
    
    private onGetDataSources(payload:payloadInfo) {
        this.setState({
            datasourcesInfo:payload.datasourcesInfo,
            endpointDetails:payload.endpointDetails
        });                         
    }

    private onSelectDataSource(payload:payloadInfo){
        this.setState({
                selectedDataSource: payload.selectedDataSource,
                currentInputParam:payload.currentInputParam,
                result:payload.result,
                displayInfo : payload. displayInfo,
                executeError :payload.executeError
            });            
    }    
    
    private onUpdateDataSourceParameters(payload:payloadInfo){
        this.setState({
            currentInputParam : {...this.state.currentInputParam, [payload.name]: payload.value},
            executeError :null
        })            
    }


    private onUpdateDataSource(payload:payloadInfo){
        this.setState({
            currentInputParam:payload.currentInputParam,
            result: payload.result,
            parseError :payload.parseError,
            executeError :payload.executeError,
            displayInfo : payload.displayInfo
        })               
    }
    
    private onExecuteServiceEndpointRequest(payload:payloadInfo){
        this.setState({
            result: payload.result,
            executeError : payload.executeError
        });
    }  
};






