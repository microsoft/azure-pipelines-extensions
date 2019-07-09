import TFS_ServiceEndpoint_Contracts = require("TFS/ServiceEndpoint/Contracts");
import TFS_ServiceEndpoint_TaskAgentClient = require("TFS/ServiceEndpoint/ServiceEndpointRestClient");

export class ExperimentRESTClient {
	public async getExperiment<T>(endpointId: string, experimentId: string, accountId: string, webPropertyId: string, profileId: string): Promise<T> {
		const parameters = {
			accountId ,
			webPropertyId,
			profileId,
			experimentId };
		const dataSourceName = "fetchExperiment";
		const experimentResults = await this.getDatasourceResponse(endpointId, dataSourceName, parameters);
		return experimentResults;
	}

	public async getExperimentResult< T >( endpointId: string, experimentId: string, ids: string, startDate: string, endDate: string, metrics: string, dimensions: string ): Promise<T> {
		const parameters = {
			ids ,
			startDate ,
			endDate,
			metrics,
			dimensions};
		const dataSourceName = "fetchData";
		const results = await this.getDatasourceResponse(endpointId, dataSourceName, parameters) ;

		const experimentResults = results.filter((row) =>  row[0] === experimentId );

		return experimentResults;
	}

	public async getDatasourceResponse(endpointId: string, datasourceName: string, parameters): Promise<any> {

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

		const data = await taskAgentClient.executeServiceEndpointRequest(serviceEndpointRequest, context.project.id, endpointId);

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
