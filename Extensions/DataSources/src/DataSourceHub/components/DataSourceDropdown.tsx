import * as React from "react";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Header, TitleSize } from "azure-devops-ui/Header";
import * as Reflux from 'reflux';
import { DataSourceActionCreators } from "../action-creators/DataSourceActionCreators";

export class DataSourceDropdown extends Reflux.Component{
    onSelect(event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) {
        if(this.props.datasourcesInfo!=null && item.text!=undefined){
            const DataSourceActionCreator = new DataSourceActionCreators({});
            DataSourceActionCreator.selectDataSource(item.text,this.props.datasourcesInfo[item.text]);
        }   
    }
    
    public render() {
        if(this.props.datasourcesInfo!=null && this.props.datasourcesInfo!=undefined ){
            if(Object.keys(this.props.datasourcesInfo).length==0){
                return (
                    <div >
                        <Header
                        className='no-h-padding'
                        title={"Data Sources"}
                        titleSize={TitleSize.Small}
                        />
                        <Header
                        className='no-h-padding'
                        title={"No Data Sources Found"}
                        titleSize={TitleSize.Small}
                        />
                     </div>
                );
            }
            else{
                let sources = Object.keys(this.props.datasourcesInfo);
                let optionItems = sources.map(x => {return {id:x,text:x};});
                return (
                    <div >
                        <Header
                        className='no-h-padding'
                        title={"Data Sources"}
                        titleSize={TitleSize.Small}
                        />
                        <Dropdown
                        className=' example-dropdown'
                        placeholder={'Select a Data Source'}
                        onSelect = {this.onSelect.bind(this)}
                        items= {optionItems}
                        />
                    </div>
                );
            }   
        }
        else if(this.props.datasourcesInfo===undefined){
           return (
                    <div >
                        <Header
                        className='no-h-padding'
                        title={"Data Sources"}
                        titleSize={TitleSize.Small}
                        />
                        <Header
                        className='no-h-padding'
                        title={"No Type Match Found"}
                        titleSize={TitleSize.Small}
                        />
                    </div>
                )
        }  
        else{
            return(null);
        } 
    }  
}




