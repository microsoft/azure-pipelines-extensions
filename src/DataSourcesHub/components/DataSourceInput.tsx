import * as React from "react";
import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";
import { SUBMIT } from '../Resources/DataSourcesResources';
import { ParamInfo } from "../states/DataSourcesExtensionState";
import { ServiceEndpointDetails } from "azure-devops-extension-api/ServiceEndpoint";

type DataSourceInputProps= {
    displayInfo : string | null
    currentInputParam: ParamInfo | null
    endpointDetails : ServiceEndpointDetails | null
}

export class DataSourceInput extends React.Component<DataSourceInputProps>{
    public onInput(name:string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, item:string){
        let DataSourceActionCreator = new DataSourcesActionCreators(null);
        DataSourceActionCreator.updateDataSourceParameters(name,item);
    }
    
    public onSubmit(){
        let DataSourceActionCreator = new DataSourcesActionCreators(null);
        DataSourceActionCreator.executeServiceEndpointRequest(this.props.displayInfo,this.props.currentInputParam,this.props.endpointDetails);
    }
   
    public renderParameters(name:string){
        if(this.props.currentInputParam!=null){
            return( 
                <div>
                    <Header
                        className='datasource-parameters-header-padding'
                        title={name}
                        titleSize={TitleSize.Small}
                    />
                    <TextField 
                        width={TextFieldWidth.auto}
                        value={this.props.currentInputParam[name]}
                        multiline
                        autoAdjustHeight
                        autoComplete
                        onChange={this.onInput.bind(this,name)}
                    />
                </div>
            );
        }
    }
    
    public render() {
        if(this.props.currentInputParam!=null && Object.keys(this.props.currentInputParam).length!=0){
            var inputs = Object.keys(this.props.currentInputParam);
            return(
                <div >
                    <div className='datasource-parameters-vertical-spacing-16'>
                        {inputs.map(this.renderParameters.bind(this))}
                        <ButtonGroup >
                            <Button  
                                text={SUBMIT}
                                primary={true}  
                                onClick={this.onSubmit.bind(this)}
                            />
                        </ButtonGroup>  
                    </div>
                </div>
            );
        }
        else if(this.props.currentInputParam!=null && Object.keys(this.props.currentInputParam).length==0){
            return(
                <div>
                    <div className='datasource-parameters-vertical-spacing-16' >
                        <ButtonGroup>
                            <Button
                                text={SUBMIT}
                                primary={true}
                                onClick={this.onSubmit.bind(this)}
                            />
                        </ButtonGroup>
                    </div>
                </div>);
        }
        else{
            return(null);
        }    
    }
}