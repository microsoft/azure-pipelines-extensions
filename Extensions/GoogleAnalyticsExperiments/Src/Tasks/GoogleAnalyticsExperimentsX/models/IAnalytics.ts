export interface IVariation {
	name ?: string | null;
	url ?: string | null;
	status ?: string | null;
	weight ?: number | null;
	won ?: boolean | null;
}

export interface IExperiment {
	id: string;
	name ?: string | null;
	objectiveMetric ?: string | null;
	status ?: string | null;
	winnerConfidenceLevel ?: number | null;
	trafficCoverage ?: number | null;
	equalWeighting ?: boolean | null;
	variation ?: IVariation | null;
}

export interface IAuthClaimSet {
	iss ?: string;
	aud ?: string;
	scope ?: string;
	iat ?: number;
	exp ?: number;
}
