import * as React from "react";
import { ExperimentCardInfo } from "../entity/ExperimentCardInfo";

interface IExperimentCardProps {
	experimentCardInfo: ExperimentCardInfo;
}

export class ExperimentCard extends React.Component<IExperimentCardProps, {}> {

	constructor(props) {
		super(props);
	}

	public render() {

		const cardInfo = this.props.experimentCardInfo;

		if (!cardInfo) {
			return;
		}

		return (
			<div className="marginOnTop">
				<div className="card">
					<div className="card-header">
						<div className="row">
							<div className="col">
								<div className="float-right">{cardInfo.getProjectName()}</div>
								<div >{cardInfo.getExperimentName()} ( {cardInfo.getEnvironmentName()} )</div>
							</div>
						</div>
					</div>

					<div className="card-body">
						<table className="table">
							<thead>
								<tr>
									<th>Variation</th>
									<th>Visitors</th>
									<th>Visitors Percentage</th>
									<th>Total Conversion</th>
									<th>Total Conversion Percentage</th>
								</tr>
							</thead>
							<tbody>
									{
										cardInfo.getVariationInfos().map((variation) => {
												return (
													<tr>
														<td>{variation.getName()}</td>
														<td>{variation.getVisitorsCount()}</td>
														<td>{variation.getVisitorsPercentage()}</td>
														<td>{variation.getTotalConversion()}</td>
														<td>{variation.getTotalConversionPercentage()}</td>
													</tr>
												);
										})
									}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	}
}
