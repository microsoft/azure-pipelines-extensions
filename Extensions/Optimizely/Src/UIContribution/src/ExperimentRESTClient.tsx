import TFS_ServiceEndpoint_Contracts = require("TFS/ServiceEndpoint/Contracts");
import TFS_ServiceEndpoint_TaskAgentClient = require("TFS/ServiceEndpoint/ServiceEndpointRestClient");

export interface IOptimizelyProject {
	id: string;
	name: string;
}

export interface IOptimizelyVariation {
	variation_id: string;
	name: string;
	key: string;
	weight: number;
}

export interface IOptimizelyExperiment {
	id: string;
	name: string;
	key: string;
	status: string;
	variations: IOptimizelyVariation[];
	environments: any;
	holdback: number;
	type: string;
	audience_conditions: string;
}

export interface IOptimizelyVariationMetric {
	variation_id: string;
	value: number;
	rate: number;
}

export interface IOptimizelyMetric {
	name: string;
	results: { [key: string]: IOptimizelyVariationMetric; };
}

export interface IOptimizelyVariationReach {
	count: number;
	variation_id: string;
	variation_reach: number;
}

export interface IOptimizelyReach {
	baseline_count: number;
	total_count: number;
	variations: { [key: string]: IOptimizelyVariationReach; };
}

export interface IOptimizelyResult {
	experiment_id: string;
	metrics: IOptimizelyMetric[];
	reach: IOptimizelyReach;
}

export class ExperimentRESTClient {

	public async getProjects<T extends IOptimizelyProject>(endpointId: string): Promise<T[]> {
		const parameters = {};
		const dataSourceName = "OptimizelyXProject";
		const project = await this.getDatasourceResponse(endpointId, dataSourceName, parameters);
		return project;
	}

	public async getProject<T extends IOptimizelyProject>(endpointId: string, projectId: string): Promise<T> {
		const parameters = {
			ProjectId: projectId,
		};
		const dataSourceName = "OptimizelyXProject";
		const project = await this.getDatasourceResponse(endpointId, dataSourceName, parameters);
		return project;
	}

	public async getExperiments<T extends IOptimizelyExperiment>(endpointId: string, projectId: string): Promise<T[]> {
		const parameters = {
			ProjectId: projectId,
		};
		const dataSourceName = "OptimizelyXExperiment";
		const experiment = await this.getDatasourceResponse(endpointId, dataSourceName, parameters);
		return experiment;
	}

	public async getExperiment<T extends IOptimizelyExperiment>(endpointId: string, experimentId: string): Promise<T> {
		const parameters = {
			ExperimentId: experimentId,
		};
		const dataSourceName = "OptimizelyXExperiment";
		const experiment = await this.getDatasourceResponse(endpointId, dataSourceName, parameters);
		return experiment;
	}

	public async getExperimentResult<T extends IOptimizelyResult>(endpointId: string, experimentId: string): Promise<T> {
		const parameters = {
			ExperimentId: experimentId,
		};
		const dataSourceName = "OptimizelyXExperimentResults";
		const experimentResults = await this.getDatasourceResponse(
			endpointId,
			dataSourceName, parameters);
		return experimentResults;
	}

	public async getDatasourceResponse(
		endpointId: string,
		datasourceName: string,
		parameters): Promise<any> {

		const taskAgentClient = TFS_ServiceEndpoint_TaskAgentClient.getClient();
		const context = VSS.getWebContext();

		const serviceEndpointRequest: TFS_ServiceEndpoint_Contracts.ServiceEndpointRequest = {
			dataSourceDetails: {
				dataSourceName: datasourceName,
				dataSourceUrl: "",
				headers: [],
				initialContextTemplate: "",
				parameters,
				requestContent: "",
				requestVerb: "",
				resourceUrl: "",
				resultSelector: "",
			},
			resultTransformationDetails: null,
			serviceEndpointDetails: null,
		};
		const data = await taskAgentClient.executeServiceEndpointRequest(serviceEndpointRequest,
			context.project.id, endpointId);

		if (!data || !data.result || data.result.length === 0) {
			throw new Error("Failed to fetch datasource data");
		}

		if (data.result.length === 1) {
			const result =  JSON.parse(data.result[0]);
			return result;
		} else {
			const result = [];
			for (const line of data.result) {
				result.push(JSON.parse(line));
			}
			return result;
		}
	}
}
