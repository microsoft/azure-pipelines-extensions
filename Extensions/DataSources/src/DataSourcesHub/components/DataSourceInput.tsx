import * as React from "react";
import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";
import { DataSourcesResources } from '../Resources/DataSourcesResources';
import { Parameters } from "../Models/DataSourcesExtensionModel";
import { ServiceEndpointDetails } from "azure-devops-extension-api/ServiceEndpoint";

type DataSourceInputProps = {
    dataSourceInfoDisplay: string 
    currentInputParameters: Parameters
    endpointDetails: ServiceEndpointDetails
}

export class DataSourceInput extends React.Component<DataSourceInputProps>{

    public render(): JSX.Element {
    let inputParameters: JSX.Element[] = [<div/>];
        if (this.props.currentInputParameters !== null && Object.keys(this.props.currentInputParameters).length !== 0) {
            var inputParameterNames = Object.keys(this.props.currentInputParameters);
            inputParameters = inputParameterNames.map(this.getInputParameters.bind(this)); 
        }

        if(this.props.currentInputParameters) {
            return (
                <div >
                    <div className='datasource-parameters'>
                        {inputParameters}
                        <ButtonGroup >
                            <Button
                                text={DataSourcesResources.Submit}
                                primary={true}
                                onClick={this.onSubmit.bind(this)}
                            />
                        </ButtonGroup>
                    </div>
                </div>
            );
        }
        else {
            return (<div/>);
        }
    }

    private getInputParameters(name: string): JSX.Element {
        if (this.props.currentInputParameters != null) {
            return (
                <div>
                    <Header
                        className='datasource-parameters-header'
                        title={name}
                        titleSize={TitleSize.Small}
                    />
                    <TextField
                        width={TextFieldWidth.auto}
                        value={this.props.currentInputParameters[name]}
                        multiline
                        autoAdjustHeight
                        spellCheck={false}
                        onChange={this.onInputParameterChange.bind(this, name)}
                    />
                </div>
            );
        } else {
            return <div/>;
        }
    }

    private onInputParameterChange(name: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, item: string) {
        let DataSourceActionCreator = DataSourcesActionCreators.getInstance();
        DataSourceActionCreator.updateDataSourceParameters(name, item);
    }

    private onSubmit() {
        let DataSourceActionCreator = DataSourcesActionCreators.getInstance();
        DataSourceActionCreator.executeServiceEndpointRequest(this.props.dataSourceInfoDisplay, this.props.currentInputParameters, this.props.endpointDetails);
    }
}