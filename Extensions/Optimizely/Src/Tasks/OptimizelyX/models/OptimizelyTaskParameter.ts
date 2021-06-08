import * as tl from 'azure-pipelines-task-lib/task';

export class OptimizelyTaskParameter {
  private endpointId: string;
  private projectType: string;
  private projectId: string;
  private environmentName: string;
  
  private type: string;
  private featureId: string;
  private featureState: boolean;
  private featureVariables: string;
  
  private experimentId: string;
  private action: string;
  private totalTraffic: string;
  private trafficByVariation: string;
  private audience: string;

  constructor() {
    try {
      this.endpointId = tl.getInput('OptimizelyXEndpoint', true);
      this.projectId = tl.getInput('Project', true);
      this.environmentName = tl.getInput("Environment");
      
      this.type = tl.getInput("Type", true);
      this.featureId = tl.getInput('Feature');
      this.featureState = tl.getBoolInput('FeatureState');
      this.featureVariables = tl.getInput('FeatureVariables');
      
      this.experimentId = tl.getInput('Experiment');
      this.action = tl.getInput('Action');
      this.totalTraffic = tl.getInput('Traffic', true);
      this.trafficByVariation = tl.getInput('TrafficByVariation');
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

  public getType(): string {
    return this.type;
  }

  public getProjectId(): string {
    return this.projectId;
  }

  public getExperimentId(): string {
    return this.experimentId;
  }

  public getFeatureId(): string {
    return this.featureId;
  }

  public getFeatureState(): boolean {
    return this.featureState;
  }

  public getTotalTraffic(): string {
    return this.totalTraffic;
  }

  public getTrafficByVariation(): string {
    return this.trafficByVariation;
  }

  public getFeatureVariables(): string {
    return this.featureVariables;
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
