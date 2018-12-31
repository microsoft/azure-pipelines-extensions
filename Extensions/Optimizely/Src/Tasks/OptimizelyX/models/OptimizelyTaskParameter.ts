import * as tl from 'azure-pipelines-task-lib/task';

export class OptimizelyTaskParameter {
  private endpointId: string;
  private action: string;
  private environmentName: string;
  private projectType: string;
  private projectId: string;
  private experimentId: string;
  private totalTraffic: string;
  private trafficByVariation: string;
  private audience: string;

  constructor() {
    try {
      this.endpointId = tl.getInput('OptimizelyXEndpoint', true);
      this.action = tl.getInput('Action', true);
      this.environmentName = tl.getInput("Environment");
      this.projectId = tl.getInput('Project', true);
      this.experimentId = tl.getInput('Experiment', true);
      this.totalTraffic = tl.getInput('Traffic', true);
      this.trafficByVariation = tl.getInput('TrafficByVariation', true);
      this.audience = tl.getInput('Audience');
    } catch (error) {
      throw new Error(tl.loc("ConstructorFailed", error.message));
    }
  }

  public getEndpointId(): string {
    return this.endpointId;
  }

  public getAction(): string {
    return this.action;
  }

  public getEnvironmentName(): string {
    return this.environmentName;
  }

  public getProjectId(): string {
    return this.projectId;
  }

  public getExperimentId(): string {
    return this.experimentId;
  }

  public getTotalTraffic(): string {
    return this.totalTraffic;
  }

  public getTrafficByVariation(): string {
    return this.trafficByVariation;
  }

  public getAudience(): string {
    return this.audience;
  }

  public getProjectType(): string {
    return this.projectType;
  }

  public setProjectType(projectType: string): void {
    this.projectType = projectType;
  }

  public isWebProject(): boolean {
    return this.projectType == "web";
  }
}
