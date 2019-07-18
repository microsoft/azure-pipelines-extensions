import {TaskParameter} from './../models/TaskParameter';
import {IExperiment} from './../models/IOptimize';
import * as restm from 'typed-rest-client/RestClient';
import * as tl from 'azure-pipelines-task-lib/task';

let param: TaskParameter = TaskParameter.getInstance();
let endpointId: string = param.endpoint;
let issuer: string= tl.getEndpointAuthorizationParameter(endpointId, 'Issuer', true);
let audience: string = tl.getEndpointAuthorizationParameter(endpointId, 'Audience', true);
let scope: string = tl.getEndpointAuthorizationParameter(endpointId, 'Scope', true);

let endedExperiment = {
    "statusCode":200,
    "result":{
        "id":"dummyExperimentId",
        "name":"xyz",
        "status":"ENDED"
    }
}

let correctRestRes = {
    "statusCode":200,
    "result":{
        "id":"dummyExperimentId",
        "name":"xyz",
        "status":"RUNNING"
    }
}

let incorrectRestRes = {
    "statusCode":401,
    "error": {
        "errors": [
            {
                "domain": "global",
                "reason": "authError",
                "message": "Invalid Credentials",
                "locationType": "header",
                "location": "Authorization"
            }
        ],
        "code": 401,
        "message": "Invalid Credentials"
    }
}

export async function UpdateExperimentUtil(testclient: restm.RestClient , experiment:IExperiment ) {
    if(scope === "endedExperiment") {
        return endedExperiment;
    }

    if(issuer ===  "correctIssuer") {
        return correctRestRes;
    }
    return incorrectRestRes;
};

export async function GetExperimentUtil(testclient: restm.RestClient) {
    if(scope === "endedExperiment") {
        return endedExperiment;
    }

    if(issuer ===  "correctIssuer") {
        return correctRestRes;
    }
    return incorrectRestRes;
};

export function Authorize(callback) {
    let token: string;
    let error: string;
    if(audience ===  "correctAudience") {
        token = "correctAccessToken";
        error = null ;
    }
    else {
        token = null;
        error = "DummyError";
    }
    callback(error, token);

};
