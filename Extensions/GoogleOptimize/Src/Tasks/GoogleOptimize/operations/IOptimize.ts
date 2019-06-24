
export interface IVariation {
    name ?: string | null ;
    url ?: string | null;
    status ?: string | null;
    weight ?: number | null;
    won ?: boolean | null;
}

export interface IExperiment {
    id : string ;
    name ?: string | null;
    objectiveMetric ?: string | null ;
    status ?: string  | null;
    winnerConfidenceLevel ?: number | null ;
    trafficCoverage ?: number | null ;
    equalWeighting ?: boolean | null ;
    variation ?: IVariation | null;
}

export interface Credentials {
    refresh_token?: string | null;
    expiry_date?: number | null;
    access_token?: string | null;
    token_type?: string | null;
    id_token?: string | null;
}
