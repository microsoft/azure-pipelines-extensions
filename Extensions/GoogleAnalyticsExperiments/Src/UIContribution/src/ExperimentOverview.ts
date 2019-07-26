import { ExperimentUtility } from "./ExperimentUtility";

VSS.notifyLoadSucceeded();
const vssConfiguration = VSS.getConfiguration();

const experimentUtility = new ExperimentUtility();
experimentUtility.bindUI(vssConfiguration);

VSS.register("registeredEnvironmentObject", {
	getActionContext:  () => {
		return "extension's context, for commands related to this extension.";
	},
	isDisabled:  (state) =>  {
		return !experimentUtility.isExperimentationTaskAvailable(state);;
	},
	isInvisible:  (state) => {
		return !experimentUtility.isExperimentationTaskAvailable(state);
	},
	pageTitle: (state) => {
		return "Experiment";
	},
	updateContext:  (tabContext) => {
		return "done";
	},
});
