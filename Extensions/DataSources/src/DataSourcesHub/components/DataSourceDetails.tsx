import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { DataSourcesActionCreators } from "../action-creators/DataSourcesActionCreators";
import { DataSourcesResources } from '../Resources/DataSourcesResources';
import { Parameters, DataSourcesMap } from "../Models/DataSourcesExtensionModel";

type DataSourceDetailsProps = {
    currentInputParameters: Parameters | null
    dataSourceInfoDisplay: string | null
    dataSourcesMap: DataSourcesMap | null
}

export class DataSourceDetails extends React.Component<DataSourceDetailsProps>{
    public render(): JSX.Element  {
        if (this.props.dataSourceInfoDisplay !== null) {
            return (
                <div>
                    <div className="datasource-detail">
                        <Header
                            className='datasource-details-header'
                            title={DataSourcesResources.DataSource}
                            titleSize={TitleSize.Small}
                        />
                        <TextField
                            value={this.props.dataSourceInfoDisplay}
                            multiline
                            spellCheck={false}
                            width={TextFieldWidth.auto}
                            autoAdjustHeight
                            onChange={this.onChange.bind(this)}
                        />
                    </div>
                </div>
            );
        }
        else {
            return (<div/>);
        }
    }

    private onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, item: string) {
        if (this.props.dataSourcesMap != null) {
            let DataSourceActionCreator = DataSourcesActionCreators.getInstance();
            DataSourceActionCreator.updateDataSource(item, this.props.currentInputParameters);
        }
    }
}