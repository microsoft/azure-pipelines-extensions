import * as React from "react";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";
import { DataSourcesResources } from '../Resources/DataSourcesResources';
import { DataSourceInfo } from "../states/DataSourcesExtensionState";

type DataSourceDropDownProps = {
    datasourcesInfo: DataSourceInfo | null
};

export class DataSourcesDropdown extends React.Component<DataSourceDropDownProps>{
    onSelect(event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) {
        if (this.props.datasourcesInfo != null && item.text != undefined) {
            let DataSourceActionCreator = new DataSourcesActionCreators(null);
            DataSourceActionCreator.selectDataSource(item.text, JSON.stringify(this.props.datasourcesInfo[item.text], null, 2));
        }
    }

    public render() {
        if (this.props.datasourcesInfo !== null && this.props.datasourcesInfo !== undefined) {
            if (Object.keys(this.props.datasourcesInfo).length == 0) {
                return (
                    <div >
                        <Header
                            className='datasource-dropdown-header'
                            title={DataSourcesResources.DataSources}
                            titleSize={TitleSize.Small}
                        />
                        <Header
                            className='datasource-dropdown-header'
                            title={DataSourcesResources.NoDataSource}
                            titleSize={TitleSize.Small}
                        />
                    </div>
                );
            }
            else {
                let sources = Object.keys(this.props.datasourcesInfo);
                let optionItems = sources.map(x => { return { id: x, text: x }; });
                return (
                    <div >
                        <Header
                            className='datasource-dropdown-header'
                            title={DataSourcesResources.DataSources}
                            titleSize={TitleSize.Small}
                        />
                        <Dropdown
                            placeholder={DataSourcesResources.SelectDataSource}
                            onSelect={this.onSelect.bind(this)}
                            items={optionItems}
                        />
                    </div>
                );
            }
        }
        else if (this.props.datasourcesInfo === undefined) {
            return (
                <div >
                    <Header
                        className='datasource-dropdown-header'
                        title={DataSourcesResources.DataSources}
                        titleSize={TitleSize.Small}
                    />
                    <Header
                        className='datasource-dropdown-header'
                        title={DataSourcesResources.NoTypeMatch}
                        titleSize={TitleSize.Small}
                    />
                </div>
            );
        }
        else {
            return (null);
        }
    }
}