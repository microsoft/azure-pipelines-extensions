import { SurfaceBackground, SurfaceContext } from "azure-devops-ui/Surface";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ErrorPage } from "./component/ErrorPage";
import { ExperimentCardContainer } from "./component/ExperimentCardContainer";
import { LoadingSpinner } from "./component/LoadingSpinner";
import { ExperimentCardInfo } from "./entity/ExperimentCardInfo";
import { TaskExperimentInfo } from "./entity/TaskExperimentInfo";
import { VariationInfo } from "./entity/VariationInfo";
import { ExperimentRESTClient } from "./ExperimentRESTClient";

const GOOGLE_ANALYTICS_TASK_ID = "e7307da0-85f4-11e9-9dec-fdd4f9b653a3";

export class ExperimentUtility {

	private experimentTaskId: string;
	private experimentRESTClient: ExperimentRESTClient;

	constructor() {
		this.experimentTaskId = GOOGLE_ANALYTICS_TASK_ID;
		this.experimentRESTClient = new ExperimentRESTClient();
	}

	public getExperimentTaskId() {
		return this.experimentTaskId;
	}

	public setExperimentTaskId(experimentTaskId: string) {
		this.experimentTaskId = experimentTaskId;
	}

	public async bindUI(vssConfiguration) {

		// Loading spinner
		ReactDOM.render(
			< LoadingSpinner/>,
			document.getElementById("experimentsInfo"),
		);

		const taskExperimentInfoByProjectIdMap = this.getExperimentInfoByProjectIdMap(vssConfiguration);

		const experimentCardInfos: ExperimentCardInfo[] = [];
		let errorURL: string;

		for (const webPropertyId in taskExperimentInfoByProjectIdMap) {

			if (!taskExperimentInfoByProjectIdMap[webPropertyId]) {
				continue;
			}

			const taskExperimentInfos = taskExperimentInfoByProjectIdMap[webPropertyId];

			for (const taskExperimentInfo of taskExperimentInfos) {
				const endpointId = taskExperimentInfo.endpointId;
				const experimentId = taskExperimentInfo.experimentId;
				const accountId = taskExperimentInfo.accountId;
				const profileId = taskExperimentInfo.profileId;

				const analyticsExperiment: any =
					await this.experimentRESTClient.getExperiment(endpointId, experimentId, accountId, webPropertyId, profileId);

				// For generating report url
				const internalWebPropertyId = analyticsExperiment.internalWebPropertyId;
				errorURL = `https://analytics.google.com/analytics/web/#/report/siteopt-experiments/a${accountId}w${internalWebPropertyId}p${profileId}/`;

				const ids: string  = `ga:${profileId}`;
				let metrics: string = "ga:sessions,ga:bounceRate,ga:pageviews";
				const desiredMetric = analyticsExperiment.objectiveMetric ;

				if (desiredMetric !== "ga:bounces" && desiredMetric !== "ga:pageviews" && desiredMetric !== "ga:sessions" ) {
					metrics = metrics + "," + desiredMetric ;
				}

				const created: string = analyticsExperiment.created;
				const startDate: string = created.substring(0, 10) ;
				const endDate: string = "today";
				const dimensions: string = "ga:experimentId,+ga:experimentVariant";

				let winner: string = "Not enough data";

				const analyticsExperimentResult: any =
					await this.experimentRESTClient.getExperimentResult(endpointId, experimentId, ids, startDate, endDate, metrics, dimensions );

				if (!!analyticsExperimentResult && analyticsExperimentResult.length !== 0 ) {
					const experimentCardInfo = new ExperimentCardInfo(experimentId, analyticsExperiment.name, accountId, internalWebPropertyId, profileId);

					let counter = 0 ;
					for (const variation of analyticsExperiment.variations) {

						let name = variation.name ;
						if (name.length === 0) {
							// name = "Original" ;
							if (counter === 0) {
								name = "Original" ;
							} else {
								name = "Variation " + counter ;
							}
						}

						if (!!variation.won && variation.won === true) {
							winner = name;
						}

						const variationInfo: VariationInfo = new VariationInfo(name);

						variationInfo.sessions = Math.round(analyticsExperimentResult[counter][2] * 100) / 100;
						variationInfo.pageViews = Math.round(analyticsExperimentResult[counter][3] * 100) / 100;
						variationInfo.bounceRate = Math.round(analyticsExperimentResult[counter][4] * 100) / 100;

						if (analyticsExperimentResult[counter].length === 6) {
							variationInfo.additionalMetric = Math.round(analyticsExperimentResult[counter][5] * 100) / 100;
							variationInfo.additionalMetricName = desiredMetric.substring(3, desiredMetric.length);

						}
						counter++ ;
						experimentCardInfo.winner = winner ;
						experimentCardInfo.addVariationInfo(variationInfo);

					}

					experimentCardInfos.push(experimentCardInfo);
				}

			}
		}

		if (experimentCardInfos.length === 0) {
			ReactDOM.render(
				< ErrorPage errorURL = {errorURL}/>,
				document.getElementById("experimentsInfo"),
			);
		} else {
			ReactDOM.render(
				<SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
    				<ExperimentCardContainer experimentCardInfos={experimentCardInfos} />
  				</SurfaceContext.Provider>,
				document.getElementById("experimentsInfo"),
			);
		}
	}

	public isExperimentationTaskAvailable(vssConfiguration) {
		const experimentsInfo = this.getExperimentInfoByProjectIdMap(vssConfiguration);
		return !this.isEmptyObject(experimentsInfo) ;
	}

 	public isEmptyObject( obj ) {
		for (const field of Object.keys(obj)) {
			return false;
		}
		return true;
	}

	private addDataNode(textContent) {
		const listView = document.getElementById("experimentsInfo");
		const listViewItem = document.createElement("li");

		listViewItem.appendChild(document.createTextNode(textContent));
		listView.appendChild(listViewItem);
	}

	private getExperimentInfoByProjectIdMap(vssConfiguration) {
		const taskByIdMap = this.getTasksByIdMap(vssConfiguration);
		const experimentationTasks = taskByIdMap[this.experimentTaskId];

		const experimentInfoByProjectIdMap = {};

		if (!!experimentationTasks) {
			experimentationTasks.forEach((task) => {
				const inputs = task.inputs;
				if (!!inputs) {
					const experimentId = inputs.experimentName;
					const endpointId = inputs.googleEndpoint;
					const accountId = inputs.accountId;
					const webPropertyId = inputs.webPropertyId;
					const profileId = inputs.profileId;

					const experimentInfo = new TaskExperimentInfo(experimentId, endpointId, accountId, webPropertyId, profileId);

					if (!experimentInfoByProjectIdMap[webPropertyId]) {
						experimentInfoByProjectIdMap[webPropertyId] = [experimentInfo];
					} else {
						const experimentInfos = experimentInfoByProjectIdMap[webPropertyId];

						if (!experimentInfos.includes(experimentId)) {
							experimentInfos.push(experimentInfo);
						}
					}
				}
			});
		}

		return experimentInfoByProjectIdMap;
	}

	private getTasksByIdMap(vssConfiguration) {
		const tasksByIdMap = {};

		if (!!vssConfiguration && vssConfiguration.releaseEnvironment) {
			const deployPhaseSnapshot =  vssConfiguration.releaseEnvironment.deployPhasesSnapshot;

			if (!!deployPhaseSnapshot) {
				for (const deployPhase of deployPhaseSnapshot) {
					const workFlowTasks = deployPhase.workflowTasks;

					if (!!workFlowTasks) {
						for (const workflowTask of workFlowTasks) {
							let tasks = tasksByIdMap[workflowTask.taskId];

							if (!tasks) {
								tasks = [];
								tasksByIdMap[workflowTask.taskId] = tasks;
							}

							tasks.push(workflowTask);
						}
					}
				}
			}
		}

		return tasksByIdMap;
	}

}
