export class TaskExperimentInfo {
	private projectId: string;
	private experimentId: string;
	private endpointId: string;
	private environmentName: string;

	constructor(projectId: string, experimentId: string, endpointId: string, environmentName: string) {
		this.projectId = projectId;
		this.experimentId = experimentId;
		this.endpointId = endpointId;
		this.environmentName = environmentName;
	}

	public setProject(projectId: string) {
		this.projectId = projectId;
	}

	public getProjectId() {
		return this.projectId;
	}

	public setExperimentId(experimentId: string) {
		this.experimentId = experimentId;
	}

	public getExperimentId() {
		return this.experimentId;
	}

	public setEndpointId(endpointId: string) {
		this.endpointId = endpointId;
	}

	public getEndpointId() {
		return this.endpointId;
	}

	public setEnvironmentName(environmentName: string) {
		this.environmentName = environmentName;
	}

	public getEnvironmentName() {
		return this.environmentName;
	}
}
