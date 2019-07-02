import * as Reflux from 'reflux';

export const DataSourcesActions = Reflux.createActions([
    "GetDataSources",
    "SelectDataSource",
    "UpdateDataSource",
    "UpdateDataSourceParameters",
    "ExecuteServiceEndpointRequest",
    "Error"
]);