import * as React from "react";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";
import { DATA_SOURCES,SELECT_DATASOURCE,NO_DATASOURCE,NO_TYPE_MATCH } from '../Resources/DataSourcesResources';
import { DataSourceInfo } from "../states/DataSourcesExtensionState";

type DataSourceDropDownProps= {
    datasourcesInfo:DataSourceInfo | null 
}

export class DataSourcesDropdown extends React.Component<DataSourceDropDownProps>{
    onSelect(event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) {
        if(this.props.datasourcesInfo!=null && item.text!=undefined){
            let DataSourceActionCreator = new DataSourcesActionCreators(null);
            DataSourceActionCreator.selectDataSource(item.text,JSON.stringify(this.props.datasourcesInfo[item.text],null,2));
        }   
    }
    
    public render() {
        if(this.props.datasourcesInfo!==null && this.props.datasourcesInfo!==undefined ){
            if(Object.keys(this.props.datasourcesInfo).length==0){
                return (
                    <div >
                        <Header
                            className='datasource-dropdown-header-padding'
                            title={DATA_SOURCES}
                            titleSize={TitleSize.Small}
                        />
                        <Header
                            className='datasource-dropdown-header-padding'
                            title={NO_DATASOURCE}
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
                            className='datasource-dropdown-header-padding'
                            title={DATA_SOURCES}
                            titleSize={TitleSize.Small}
                        />
                        <Dropdown
                            placeholder={SELECT_DATASOURCE}
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
                            className='datasource-dropdown-header-padding'
                            title={DATA_SOURCES}
                            titleSize={TitleSize.Small}
                        />
                        <Header
                            className='datasource-dropdown-header-padding'
                            title={NO_DATASOURCE}
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