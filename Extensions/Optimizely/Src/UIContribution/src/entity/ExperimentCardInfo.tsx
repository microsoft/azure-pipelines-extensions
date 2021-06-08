import { VariationInfo } from "./VariationInfo";

export class ExperimentCardInfo {

	private projectName;
	private experimentName;
	private environmentName;
	private variationInfos: VariationInfo[];

	constructor(projectName: string, experimentName: string, environmentName: string) {
		this.projectName = projectName;
		this.experimentName = experimentName;
		this.environmentName = environmentName;
		this.variationInfos = [];
	}

	public getProjectName() {
		return this.projectName;
	}

	public getExperimentName() {
		return this.experimentName;
	}

	public getEnvironmentName() {
		return this.environmentName;
	}

	public addVariationInfo(variationInfo: VariationInfo) {
		this.variationInfos.push(variationInfo);
	}

	public getVariationInfos() {
		return this.variationInfos;
	}
}
