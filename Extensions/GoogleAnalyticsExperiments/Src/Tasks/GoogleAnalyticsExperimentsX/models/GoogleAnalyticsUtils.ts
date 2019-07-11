import {TaskParameter} from './../models/TaskParameter';
import {IExperiment, IAuthClaimSet} from './../models/IAnalytics';
import * as restm from 'typed-rest-client/RestClient';
import * as tl from 'azure-pipelines-task-lib/task';
import * as crypto from 'crypto';
const request = require('request');

let param: TaskParameter = TaskParameter.getInstance();
let endpointId = param.endpoint;
let accountId: string = param.accountId;
let webPropertyId: string = param.webPropertyId;
let profileId: string = param.profileId;

let authHeader = {
    'alg': 'RS256',
    'typ': 'JWT'
}

function getAuthClaimSet() {
    let authClaimSet: IAuthClaimSet = {};
    let currentTimeInSeconds = parseInt(Date.now() / 1000, 10); // Google wants us to use seconds

    authClaimSet.iss = param.issuer;
    authClaimSet.aud = param.audience;
    authClaimSet.scope = param.scope;
    authClaimSet.iat = currentTimeInSeconds;
    authClaimSet.exp = currentTimeInSeconds + 60; // Token valid for one minute

    return authClaimSet;
}

function urlEscape(source: string) {
    return source.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}

function base64Encode(obj: any) {
    var encoded = new Buffer(JSON.stringify(obj), 'utf8').toString('base64');
    return urlEscape(encoded);
}

export async function UpdateExperiment(restclient: restm.RestClient, experiment: IExperiment) {
    let restRes = await restclient.update(`management/accounts/${accountId}/webproperties/${webPropertyId}/profiles/${profileId}/experiments/${param.experimentId}`, experiment);
    return restRes;
}

export async function GetExperiment(restclient: restm.RestClient) {
    let restRes = await restclient.get < T > (`management/accounts/${accountId}/webproperties/${webPropertyId}/profiles/${profileId}/experiments/${param.experimentId}`);
    return restRes;
}

export async function Authorize(callback) {

    let cipher;
    let signatureInput;
    let signatureKey = param.privatekey;
    let signature;
    let jwt;

    signatureKey = signatureKey.replace(/\\n/g, '\n');
    // Setup JWT source
    signatureInput = base64Encode(authHeader) + '.' + base64Encode(getAuthClaimSet());
    // Generate JWT
    cipher = crypto.createSign('RSA-SHA256');
    cipher.update(signatureInput);
    signature = cipher.sign(signatureKey, 'base64');
    jwt = signatureInput + '.' + urlEscape(signature);
    // Send request to authorize this application
    request({
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: param.audience,
        body: 'grant_type=' + escape('urn:ietf:params:oauth:grant-type:jwt-bearer') +
            '&assertion=' + jwt
    }, function(error, response, body) {
        if (error) {
            console.log(error);
            callback(new Error(error));
        } else {
            var gaResult = JSON.parse(body);

            if (gaResult.error) {
                callback(new Error(gaResult.error));
            } else {
                callback(null, gaResult.access_token);
            }
        }
    });

};
