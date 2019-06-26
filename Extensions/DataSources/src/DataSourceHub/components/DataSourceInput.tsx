import * as React from "react";
import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Header, TitleSize } from "azure-devops-ui/Header";
import * as Reflux from 'reflux';
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { PayloadInfo} from'../states/DataSourceExtensionstate'
import { DataSourceActionCreators } from "../action-creators/DataSourceActionCreators";

export class DataSourceInput extends Reflux.Component{
    public onInput(name:string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, item:string){
        var payload:PayloadInfo={
            "name" : name,
            "value" : item
        }
        const DataSourceActionCreator = new DataSourceActionCreators({});
        DataSourceActionCreator.updateDataSourceParameters(payload);
    }
    
    public onSubmit(){
        const DataSourceActionCreator = new DataSourceActionCreators({});
        DataSourceActionCreator.executeServiceEndpointRequest(this.props.displayInfo,this.props.currentInputParam,this.props.endpointDetails);
    }
   
    public createBoxes(name:string){
        return( 
            <div>
                <Header
                className='no-h-padding'
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
    
    public render() {
        if(this.props.currentInputParam!=null && Object.keys(this.props.currentInputParam).length!=0){
            var inputs = Object.keys(this.props.currentInputParam);
            return(
                <div >
                    <div className='rhythm-vertical-16'>
                        {inputs.map(this.createBoxes.bind(this))}
                        <ButtonGroup >
                            <Button  
                            className="btn-cta"
                            text="Submit"  
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
                    <div className='rhythm-vertical-16' >
                        <ButtonGroup>
                            <Button  className="btn-cta"
                            text="Submit" 
                            onClick={this.onSubmit.bind(this)}
                            />
                        </ButtonGroup>
                    </div>
                </div>);
        }
        else
        {
            return(null);
        }    
    }
}