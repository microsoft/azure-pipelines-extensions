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
		return false;
	},
	isInvisible:  (state) => {
		return false;
	},
	pageTitle: (state) => {
		return "Experiment";
	},
	updateContext:  (tabContext) => {
		return "done";
	},
});
