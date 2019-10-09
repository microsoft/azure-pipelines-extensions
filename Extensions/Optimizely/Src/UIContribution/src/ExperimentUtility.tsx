import * as React from "react";
import * as ReactDOM from "react-dom";
import { ExperimentCardContainer } from "./component/ExperimentCardContainer";
import { ExperimentCardInfo } from "./entity/ExperimentCardInfo";
import { TaskExperimentInfo } from "./entity/TaskExperimentInfo";
import { VariationInfo } from "./entity/VariationInfo";
import { ExperimentRESTClient, IOptimizelyExperiment,
	IOptimizelyProject, IOptimizelyResult } from "./ExperimentRESTClient";

const OPTIMIZELY_TASK_ID = "2d72713f-577c-4a89-b77c-d3c714f8268f";

export class ExperimentUtility {

	private experimentTaskId: string;
	private experimentRESTClient: ExperimentRESTClient;

	constructor() {
		this.experimentTaskId = OPTIMIZELY_TASK_ID;
		this.experimentRESTClient = new ExperimentRESTClient();
	}

	public getExperimentTaskId() {
		return this.experimentTaskId;
	}

	public setExperimentTaskId(experimentTaskId: string) {
		this.experimentTaskId = experimentTaskId;
	}

	public async bindUI(vssConfiguration) {
		const taskExperimentInfoByProjectIdMap = this.getExperimentInfoByProjectIdMap(vssConfiguration);

		/**
		 * TODO: Duplicate experiments not handled.
		 */

		const experimentCardInfos: ExperimentCardInfo[] = [];

		for (const projectId in taskExperimentInfoByProjectIdMap) {

			if (!taskExperimentInfoByProjectIdMap[projectId]) {
				continue;
			}

			const taskExperimentInfos = taskExperimentInfoByProjectIdMap[projectId];
			const endpointId = taskExperimentInfos[0].endpointId;

			const optimizelyProject: IOptimizelyProject = await this.experimentRESTClient.getProject(endpointId, projectId);

			for (const taskExperimentInfo of taskExperimentInfos) {
				const experimentId = taskExperimentInfo.experimentId;

				const optimizelyExperiment: IOptimizelyExperiment =
					await this.experimentRESTClient.getExperiment(endpointId, experimentId);
				const optimizelyExperimentResult: IOptimizelyResult =
					await this.experimentRESTClient.getExperimentResult(endpointId, experimentId);

				const experimentCardInfo = new ExperimentCardInfo(
					optimizelyProject.name,
					optimizelyExperiment.name,
					taskExperimentInfo.environmentName,
				);

				for (const variation of optimizelyExperiment.variations) {
					const primaryMetrics = optimizelyExperimentResult.metrics;

					const name = (!!variation.name) ? variation.name : variation.key;

					const variationInfo: VariationInfo = new VariationInfo(name);

					if (!!primaryMetrics && primaryMetrics.length > 0) {
						const primaryMetricsResult = primaryMetrics[0].results;
						const variationMetric = primaryMetricsResult[variation.variation_id];

						if (!!variationMetric) {
							variationInfo.setTotalConversion(variationMetric.value);
							variationInfo.setTotalConversionPercentage(variationMetric.rate * 100);
						}

						experimentCardInfo.addVariationInfo(variationInfo);
					}

					const optimizelyReach = optimizelyExperimentResult.reach;
					const variationReach = optimizelyReach.variations[variation.variation_id];

					if (!!variationReach) {
						variationInfo.setVisitorsCount(variationReach.count);
						variationInfo.setVisitorsPercentage(variationReach.variation_reach);
					}
				}

				experimentCardInfos.push(experimentCardInfo);
			}
		}

		ReactDOM.render(
			<ExperimentCardContainer experimentCardInfos={experimentCardInfos} />,
			document.getElementById("experimentsInfo"),
		);
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
					const projectId = inputs.Project;
					const experimentId = inputs.Experiment;
					const environmentName = inputs.Environment;
					const endpointId = inputs.OptimizelyXEndpoint;

					if (!experimentId) {
						return;
					}

					const experimentInfo = new TaskExperimentInfo(projectId, experimentId, endpointId, environmentName);

					if (!experimentInfoByProjectIdMap[projectId]) {
						experimentInfoByProjectIdMap[projectId] = [experimentInfo];
					} else {
						const experimentInfos = experimentInfoByProjectIdMap[projectId];

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
