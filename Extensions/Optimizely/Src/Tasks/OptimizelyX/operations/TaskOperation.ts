import { OptimizelyXClient, IOptimizelyAlphaBetaTest, IOptimizelyEnvironment, OptimizelyExperimentStatus } from './OptimizelyXClient';
import { OptimizelyTaskParameter } from './../models/OptimizelyTaskParameter'
import * as tl from 'azure-pipelines-task-lib/task';

export class TaskOperation {

  private optimizelyClient: OptimizelyXClient;
  private taskInputs: OptimizelyTaskParameter;

  constructor(taskInputs: OptimizelyTaskParameter) {
    this.taskInputs = taskInputs;
    this.optimizelyClient = this.createOptimizelyClientInstance();
  }

  public async startABTest(experiment: IOptimizelyAlphaBetaTest): Promise<void> {
      let environmentName: string = this.taskInputs.getEnvironmentName();
      let projectId: string = this.taskInputs.getProjectId();

      if(this.taskInputs.isWebProject()) {
          experiment.status = OptimizelyExperimentStatus.Running;
      } else {
          let environment: IOptimizelyEnvironment = await this.optimizelyClient.getEnvironment(projectId, environmentName);
          if (environment == null) {
              throw tl.loc("EnvironmentNotFound", environmentName);
          }

          Object.keys(experiment.environments).forEach((value) => {
              if (value.toLowerCase() == environmentName.toLowerCase()) {
                  experiment.environments[value].status = OptimizelyExperimentStatus.Running;
              }
          });
      }

      let experimentName = experiment.name;
      await this.optimizelyClient.updateExperiment(experiment.id, experiment);

      let counter: number = 6;
      while (counter > 0) {
          console.log(tl.loc("WaitingForExperimentToStart", experimentName));
          await this.sleep(10000);
          counter--;
      }

      console.log(tl.loc("ABTestStartedSuccessfully", experimentName));
      console.log(tl.loc("VisitOptimizelyPage") + ` https://app.optimizely.com/v2/projects/${projectId}/experiments`);
  }

  public async stopABTest(experiment: IOptimizelyAlphaBetaTest): Promise<void> {
      let environmentName: string = this.taskInputs.getEnvironmentName();
      let projectId: string = this.taskInputs.getProjectId();

      if(this.taskInputs.isWebProject()) {
          experiment.status = OptimizelyExperimentStatus.Paused;
      } else {
          let environment: IOptimizelyEnvironment = await this.optimizelyClient.getEnvironment(projectId, environmentName);
          if (environment == null) {
              throw tl.loc("EnvironmentNotFound", environmentName);
          }

          Object.keys(experiment.environments).forEach((value) => {
              if (value.toLowerCase() == environmentName.toLowerCase()) {
                  experiment.environments[value].status = OptimizelyExperimentStatus.Paused;
              }
          });
      }

      let experimentName = experiment.name;

      await this.optimizelyClient.updateExperiment(experiment.id, experiment);
      console.log(tl.loc("ExperimentSuccessfullyPaused", experimentName));
  }

  public updateTrafficVariation(experiment: IOptimizelyAlphaBetaTest): IOptimizelyAlphaBetaTest {
      let totalTrafficParameter : string = this.taskInputs.getTotalTraffic();
      let totalTraffic: number = Number.parseInt(totalTrafficParameter);

      if (Number.isNaN(totalTraffic)) {
          throw tl.loc("TrafficValueNotValid", totalTrafficParameter);
      }

      if (totalTraffic > 100) {
          throw tl.loc("TrafficValueCantExceed", totalTraffic);
      }

      let holdBack: number = 10000 - (totalTraffic * 100);
      experiment.holdback = holdBack;
      let trafficByVariationKeyInput = this.taskInputs.getTrafficByVariation();
      let trafficVariations = this.parseTrafficByVariation(trafficByVariationKeyInput);

      for (let i: number = 0; i < experiment.variations.length; i++) {
          let variationKey: string = (this.taskInputs.isWebProject()) ? experiment.variations[i].name : experiment.variations[i].key;
          variationKey = variationKey.toLowerCase();
          if (!trafficVariations.has(variationKey)) {
              throw tl.loc("TrafficVariationKeyNotDefined", variationKey);
          }
          experiment.variations[i].weight = trafficVariations.get(variationKey);
      }

      return experiment;
  }

  public async getAudienceCondition(projectId: string): Promise<string> {
      let audienceInput: string = this.taskInputs.getAudience();
      let audience: string = null;

      if (audienceInput == "" || audienceInput == null) {
          audience = "everyone";
      } else {
          let result: Array<any> = new Array<any>();
          result.push("or");
          let audienceINputArray: string[] = audienceInput.split(',');
          for (let i: number = 0; i < audienceINputArray.length; i++) {
              let audienceName: string = audienceINputArray[i].trim();
              let audienceId: number = await this.optimizelyClient.getAudienceId(projectId, audienceName);
              result.push({"audience_id": audienceId});
          }
          audience = JSON.stringify(result);
      }

      console.log(tl.loc("AudienceInfo", audience));
      return audience;
  }

  public parseTrafficByVariation(trafficByVariationString: string): Map<string, number> {
      let arr = new Array<string>();
      let map = new Map<string, number>();

      trafficByVariationString.split('-').forEach((val) => {
          if (!!val) {
             arr.push(val);
          }
      });


      for (let i: number = 0; i < arr.length; i++) {
         let argPair: string = arr[i].trim();
         let lastSpaceIndex: number = argPair.lastIndexOf(' ');

         if (lastSpaceIndex == -1) {
           throw tl.loc("UnableToFindValidArguments", trafficByVariationString);
         }

         let key: string = argPair.substring(0, lastSpaceIndex).trim().toLowerCase();
         let valString: string = argPair.substring(lastSpaceIndex+1, argPair.length).trim();
         let val: number = Number.parseInt(valString);

         if (Number.isNaN(val)) {
             throw tl.loc("NotValidValueForVariationKey", valString, key);
         }

         // we need to multiply the traffic value by 100 because the api accepts a traffic value from 0 to 10000
         // with every 1 percent corresponding to 100 basis points. e.g. in order to vary traffic by 2 percentage points,
         // you need to increase the current value by 200 basis points.
         val = val * 100;

         tl.debug(`Setting key: '${key}' to value: '${val}'`);
         map.set(key,val);
      }

      let totalBasisPoints: number = 0;

      map.forEach((val) => {
          totalBasisPoints += val;
      });

      if (totalBasisPoints != 10000) {
          throw tl.loc("TotalTrafficValueNotValid", totalBasisPoints);
      }

      return map;
  }

  public createOptimizelyClientInstance(): OptimizelyXClient {
      let endpointId: string = this.taskInputs.getEndpointId();
      let endpointUrl: string = tl.getEndpointUrl(endpointId, false);
      let pat: string = tl.getEndpointAuthorizationParameter(endpointId, 'apitoken', false);
      let oxClient = new OptimizelyXClient(endpointUrl, pat);
      return oxClient;
  }

  public async setProjectType(): Promise<void> {
    let projectId = this.taskInputs.getProjectId();
    let project = await this.optimizelyClient.getProject(projectId);

    this.taskInputs.setProjectType(project.platform);
  }

  public getOptimizelyClientInstance() {
      return this.optimizelyClient;
  }

  public sleep(ms: number) {
      return new Promise<void>(resolve => {
          setTimeout(resolve, ms);
      });
  }
}
