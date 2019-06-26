import * as React from "react";
import * as Reflux from 'reflux';
import { Header, TitleSize } from "azure-devops-ui/Header";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";

export class DataSourceResult extends Reflux.Component{
    public render() {
        if(this.props.result.statusCode=='200'){
            return( 
                <div>
                    <Header
                    className='no-h-padding'
                    title={"Result"}
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