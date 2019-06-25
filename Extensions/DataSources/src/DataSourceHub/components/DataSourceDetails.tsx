import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import * as Reflux from 'reflux';
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { DataSourceActionCreators } from "../action-creators/DataSourceActionCreators";


export class DataSourceDetails extends Reflux.Component{
    public onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, item:string) {
        if(this.props.datasourcesInfo!=null){
            const DataSourceActionCreator = new DataSourceActionCreators({});
            DataSourceActionCreator.updateDataSource(item,this.props.datasourcesInfo[this.props.selectedDataSource]);
        }
    }
    
    public render() {
        if(this.props.displayInfo!=null){
            return(
                <div>
                    <div className="rhythm-vertical-16">
                        <Header
                        className='no-h-padding'
                        title={"DataSource"}
                        titleSize={TitleSize.Small}
                        />
                        <TextField 
                        value= {JSON.stringify(this.props.displayInfo,null,4)}
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




