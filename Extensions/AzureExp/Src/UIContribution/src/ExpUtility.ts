import * as Release from 'azure-devops-extension-api/Release';

export namespace Constants {
    export const PROVISION_EXPERIMENT_TASK_ID = 'b89a647b-e45f-4a86-bb85-e7019474aa1d';
    export const MANAGE_EXPERIMENT_TASK_ID = '58b25f39-9b53-44ce-b6d1-08ef854e905b';
    export const FEATURE_ID_VARIABLE_NAME = 'FeatureId';
    export const PROGRESSION_ID_VARIABLE_NAME = 'ProgressionId';
    export const SERVICE_CONNECTION_ID_INPUT_NAME = 'ServiceConnectionId';
}

export default class ExpUtility {
    public static isOverviewTabVisible(context): boolean {
        // Show UI tab only if ProvisionExperiment/ManageExperiment tasks are available
        let tasksMap = this.getTasksByIdMap(context);
        return !!tasksMap[Constants.PROVISION_EXPERIMENT_TASK_ID] || !!tasksMap[Constants.MANAGE_EXPERIMENT_TASK_ID];
    }

    public static getTasksByIdMap(context) {
		let tasksByIdMap: {[key: string] : any[]} = {};

		if (!!context && context.releaseEnvironment) {
			let deployPhaseSnapshot = context.releaseEnvironment.deployPhasesSnapshot;

			if (!!deployPhaseSnapshot) {
				for (let deployPhase of deployPhaseSnapshot) {
                    let workFlowTasks = deployPhase.workflowTasks;
					if (!!workFlowTasks) {
						for (let workflowTask of workFlowTasks) {
                            if (!tasksByIdMap[workflowTask.taskId]) {
                                tasksByIdMap[workflowTask.taskId] = [];
                            }

                            tasksByIdMap[workflowTask.taskId].push(workflowTask);
						}
					}
				}
			}
		}

		return tasksByIdMap;
    }
    
    public static getFeatureAndProgressionIdFromRelease(release: Release.Release): [string, string] {
        let featureId = release.variables[Constants.FEATURE_ID_VARIABLE_NAME] && release.variables[Constants.FEATURE_ID_VARIABLE_NAME].value;
        let progressionId = release.variables[Constants.PROGRESSION_ID_VARIABLE_NAME] && release.variables[Constants.PROGRESSION_ID_VARIABLE_NAME].value;
        return [featureId, progressionId];
    }

    public static getServiceConnectionId(context) {
        let tasksMap = this.getTasksByIdMap(context);
        
        let provisionExperimentTasks = tasksMap[Constants.PROVISION_EXPERIMENT_TASK_ID];
        if (provisionExperimentTasks && provisionExperimentTasks.length > 0) {
            let serviceConnectionId = provisionExperimentTasks[0].inputs[Constants.SERVICE_CONNECTION_ID_INPUT_NAME];
            return serviceConnectionId;
        }

        let manageExperimentTasks = tasksMap[Constants.MANAGE_EXPERIMENT_TASK_ID];
        if (manageExperimentTasks && manageExperimentTasks.length > 0) {
            let serviceConnectionId = manageExperimentTasks[0].inputs[Constants.SERVICE_CONNECTION_ID_INPUT_NAME];
            return serviceConnectionId;
        }
    }

    public static getFeatureNameFromProgression(progression): string {
        // extracting feature name from FeatureRolloutMetadata of first experiment
        let featureName = progression['Studies'][0]['FeatureRolloutMetadata'].Name;
        return featureName;
    }
}