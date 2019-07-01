import * as React from "react";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";
import { DataSourcesResources } from '../Resources/DataSourcesResources';
import { DataSourcesMap } from "../Models/DataSourcesExtensionModel";

type DataSourceDropDownProps = {
    dataSourcesMap: DataSourcesMap | null | undefined
};

export class DataSourcesDropdown extends React.Component<DataSourceDropDownProps>{
    public render(): JSX.Element {
        if (this.props.dataSourcesMap !== null) {
            return (
                <div >
                    <Header
                        className='datasource-dropdown-header'
                        title={DataSourcesResources.DataSources}
                        titleSize={TitleSize.Small}
                    />
                    {this.getDataSourcesDropDown(this.props.dataSourcesMap)}
                </div>
            );
        }
        else {
            return (<div/>);
        }
    }

    private getDataSourcesDropDown(datasourcesInfo: DataSourcesMap | undefined): JSX.Element {
        if (datasourcesInfo == undefined) {
            return (<Header
                className='datasource-dropdown-header'
                title={DataSourcesResources.NoTypeMatch}
                titleSize={TitleSize.Small}
            />);
        }

        if (Object.keys(datasourcesInfo).length == 0) {
            return (
                <Header
                    className='datasource-dropdown-header'
                    title={DataSourcesResources.NoDataSource}
                    titleSize={TitleSize.Small}
                />
            );
        }
        else{
            let sources = Object.keys(datasourcesInfo);
            let optionItems = sources.map(x => { return { id: x, text: x }; });
            return (
                <Dropdown
                    placeholder={DataSourcesResources.SelectDataSource}
                    onSelect={this.onSelect.bind(this)}
                    items={optionItems}
                />
            );
        }
    }

    private onSelect(event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) {
        if (this.props.dataSourcesMap != null && item.text != undefined) {
            let DataSourceActionCreator = DataSourcesActionCreators.getInstance();
            DataSourceActionCreator.selectDataSource(item.text, JSON.stringify(this.props.dataSourcesMap[item.text], null, 2));
        }
    }
}