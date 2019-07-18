import * as React from "react";
import { ExperimentCardInfo } from "../entity/ExperimentCardInfo";
import { ExperimentCard } from "./ExperimentCard";

interface IExperimentCardProps {
	experimentCardInfos: ExperimentCardInfo[];
}

export class ExperimentCardContainer extends React.Component<IExperimentCardProps, {}> {

	constructor(props) {
		super(props);
	}

	public render() {
		return (
			<div className="row">
				<div className="col-11">
					{
						this.props.experimentCardInfos.map( (experimentCardInfo) => {
							return <ExperimentCard experimentCardInfo = {experimentCardInfo} />;
						})
					}
				</div>
			</div>
		);
	}
}
