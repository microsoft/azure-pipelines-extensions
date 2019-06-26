import "./DataSourcesHub.scss";
import "es6-promise/auto";
import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { DataSourceView } from "./components/DataSourceView";
import * as ReactDOM from "react-dom";

class HubContent extends React.Component{
    
    public componentDidMount() {
        SDK.init();
    }

    public render(): JSX.Element {
        return (
                <div className="containerStyle">
                    <DataSourceView/>
                </div>                   
        );
    }    
}

ReactDOM.render(<HubContent />, document.getElementById("root"));