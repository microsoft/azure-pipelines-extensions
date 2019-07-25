import "./DataSourcesHub.scss";
import "es6-promise/auto";
import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { DataSourceView } from "./components/DataSourceView";
import * as ReactDOM from "react-dom";

class DataSourcesHub extends React.Component {

    public componentDidMount() {
        SDK.init();
    }

    public render(): JSX.Element {
        return (
            <div className="datasources-container">
                <DataSourceView />
            </div>
        );
    }
}

ReactDOM.render(<DataSourcesHub />, document.getElementById("datasources-root"));