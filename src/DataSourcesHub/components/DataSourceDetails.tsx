import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";
import { DATA_SOURCE } from '../Resources/DataSourcesResources';
import { ParamInfo, DataSourceInfo } from "../states/DataSourcesExtensionState";

type DataSourceDetailsProps= {
    currentInputParam: ParamInfo | null
    displayInfo: string | null  
    datasourcesInfo : DataSourceInfo | null 
}

export class DataSourceDetails extends React.Component<DataSourceDetailsProps>{
    public onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, item:string) {
        if(this.props.datasourcesInfo!=null){
            let DataSourceActionCreator = new DataSourcesActionCreators(null);
            DataSourceActionCreator.updateDataSource(item,this.props.currentInputParam);
        }
    }
    
    public render() {
        if(this.props.displayInfo!=null){
            return(
                <div>
                    <div className="datasource-detail-vertical-spacing-16">
                        <Header
                            className='datasource-details-header-padding'
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