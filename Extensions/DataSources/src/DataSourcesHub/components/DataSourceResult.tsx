import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { DataSourcesResources } from '../Resources/DataSourcesResources';
import { ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint";

type DataSourceResultProps = {
    result: ServiceEndpointRequestResult | null
}

export class DataSourceResult extends React.Component<DataSourceResultProps>{

    public render(): JSX.Element {
        if (this.props.result !== null && this.props.result.statusCode == '200') {
            return (
                <div>
                    <Header
                        className='datasource-result-header'
                        title={DataSourcesResources.Result}
                        titleSize={TitleSize.Small}
                    />
                    <TextField
                        value={this.props.result.result}
                        multiline
                        readOnly
                        width={TextFieldWidth.auto}
                        autoAdjustHeight
                    />
                </div>
            );
        }
        else {
            return (<div />);
        }
    }
}