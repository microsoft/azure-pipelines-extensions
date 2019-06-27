import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { RESULT } from '../Resources/DataSourcesResources';
import { ServiceEndpointRequestResult } from "azure-devops-extension-api/ServiceEndpoint";

type DataSourceResultProps= {
    result: ServiceEndpointRequestResult | null
}

export class DataSourceResult extends React.Component<DataSourceResultProps>{
    constructor(props:DataSourceResultProps){
        super(props);
    }

    public render() {
        if(this.props.result!=null && this.props.result.statusCode=='200'){
            return( 
                <div>
                    <Header
                        className='datasource-result-header-padding'
                        title={RESULT}
                        titleSize={TitleSize.Small}
                    />
                    <TextField 
                        value= {this.props.result.result}
                        multiline
                        readOnly
                        width={TextFieldWidth.auto}
                        autoAdjustHeight
                        autoComplete
                    />
                </div>
             );
        }
        else{
            return(null);
        }
    }  
}