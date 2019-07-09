import { ZeroData, ZeroDataActionType } from "azure-devops-ui/ZeroData";
import * as React from "react";

export class ErrorPage extends React.Component<any, any> {

	constructor(props) {
		super(props);
	}

	public render(): JSX.Element {
		const errorURL = this.props.errorURL;

		return (
            <div style={{position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -80%)"}}>
                <ZeroData
                    primaryText="No reports found"
                    secondaryText={
                        <span>
                            Analytics is still collecting data. Try again after sometime.
                        </span>
                    }
                    imageAltText="No Result"
                    imagePath={require("./noResult.png")}
                    actionText="Google Analytics"
                    actionType={ZeroDataActionType.ctaButton}
                    onActionClick= {(event, item) =>
                        window.open(errorURL)
                    }
                />
            </div>
        );
    }
}
