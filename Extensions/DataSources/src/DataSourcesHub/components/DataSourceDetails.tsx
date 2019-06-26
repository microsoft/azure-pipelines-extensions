import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { DataSourceActionCreators } from "../action-creators/DataSourceActionCreators";
import { DATA_SOURCE } from '../Resources/DataSourceResources';
import { ParamInfo, DataSourceInfo } from "../states/DataSourceExtensionState";

type DataSourceDetailsProps= {
    currentInputParam: ParamInfo | null
    displayInfo: string | null  
    datasourcesInfo : DataSourceInfo | null 
}

export class DataSourceDetails extends React.Component<DataSourceDetailsProps>{
    public onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, item:string) {
        if(this.props.datasourcesInfo!=null){
            let DataSourceActionCreator = new DataSourceActionCreators({});
            DataSourceActionCreator.updateDataSource(item,this.props.currentInputParam);
        }
    }
    
    public render() {
        if(this.props.displayInfo!=null){
            return(
                <div>
                    <div className="rhythm-vertical-16">
                        <Header
                        className='no-h-padding'
                        title={DATA_SOURCE}
                        titleSize={TitleSize.Small}
                        />
                        <TextField 
                        value= {this.props.displayInfo}
                        multiline
                        width={TextFieldWidth.auto}
                        autoAdjustHeight
                        autoComplete
                        onChange={this.onChange.bind(this)} 
                        />
                     </div>
                </div>
            );
        }
        else{
            return  (null);
        }
    }
}