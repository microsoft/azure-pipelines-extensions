import { Component } from "react";
import * as React from "react";
import Spinner from "react-spinner-material";

const SpinnerColor = "#2b88d8";
const SpinnerSize = 60;
const SpinnerWidth = 3;

export class LoadingSpinner extends Component {

    public render() {
        return (
            <div style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
            }}>
                <Spinner size={SpinnerSize} spinnerColor={SpinnerColor} spinnerWidth={SpinnerWidth} visible={true} />
            </div>
        );
    }
}
