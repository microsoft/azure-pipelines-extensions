import * as fs from 'fs'
import * as crypto from 'crypto'
import * as tl from 'azure-pipelines-task-lib/task'
const request = require('request');
import { TaskParameter } from './../models/TaskParameter';
let fs = require("fs");

export class JwtHandler{
    private issuer : string ;
    private audience: string ;
    private scope : string ;
    private privatekey :string ;
    private param  : TaskParameter ;
    private authClaimSet = {};

    constructor(){
        this.param = new TaskParameter() ;
        let endpointId = this.param.getEndpoint() ;
        this.issuer = tl.getEndpointAuthorizationParameter(endpointId , 'Issuer' , true);
        this.audience = tl.getEndpointAuthorizationParameter(endpointId , 'Audience' , true);
        this.scope = tl.getEndpointAuthorizationParameter(endpointId , 'Scope' , true);
        this.privatekey = tl.getEndpointAuthorizationParameter(endpointId , 'PrivateKey' , true);
        this.authClaimSet.iss = this.issuer ;
        this.authClaimSet.aud = this.audience ;
        this.authClaimSet.scope = this.scope ;

    }
    private authHeader = {
    		'alg': 'RS256',
    		'typ': 'JWT'
    	};

    private urlEscape(source) {
        return source.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
    }

    private base64Encode(obj){
        var encoded = new Buffer(JSON.stringify(obj), 'utf8').toString('base64');
    	return this.urlEscape(encoded);
    }

    public authorize(callback){
        let self = this
    	let now = parseInt(Date.now() / 1000, 10); // Google wants us to use seconds
    	let cipher ;
    	let	signatureInput ;
    	let	signatureKey = this.privatekey ;
        //let	signatureKey = this.privatekey ;
        let	signature ;
    	let	jwt ;
    	this.authClaimSet.iat = now;
    	this.authClaimSet.exp = now + 60; // Token valid for one minute
        signatureKey = signatureKey.replace(/\\n/g, '\n');

    	// Setup JWT source
    	signatureInput = this.base64Encode(this.authHeader) + '.' + this.base64Encode(this.authClaimSet);
    	// Generate JWT
    	cipher = crypto.createSign('RSA-SHA256');
    	cipher.update(signatureInput);
    	signature = cipher.sign(signatureKey, 'base64');
    	jwt = signatureInput + '.' + this.urlEscape(signature);
    	// Send request to authorize this application
    	request({
    		method: 'POST',
    		headers: {
    			'Content-Type': 'application/x-www-form-urlencoded'
    		},
    		uri: 'https://accounts.google.com/o/oauth2/token',
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

    }
}
