// restrict usage of typed-rest-client to this file
import * as httpm from './typed-rest-client/HttpClient';
var tl = require('vsts-task-lib/task');

var packagejson = require('../package.json');

export class WebClient {
    private httpc: httpm.HttpClient

    constructor(handlers: any, options: any) {
        this.httpc = new httpm.HttpClient('artifact-engine ' + packagejson.version, handlers, options);
    }

    public get(requestUrl: string, additionalHeaders?: any): Promise<httpm.HttpClientResponse> {
        var promise = new Promise<httpm.HttpClientResponse>((resolve, reject) => {
            this.httpc.get(requestUrl, additionalHeaders).then((res: httpm.HttpClientResponse) => {
                this.processResponse(res).then(() => {
                    resolve(res);
                }, (err) => {
                    reject(err);
                })
            }, (err) => {
                reject(err);
            });
        });

        return promise;
    }

    public dispose(): void {
        this.httpc.dispose();
    }

    public async processResponse(res: httpm.HttpClientResponse) {
        const statusCode: number = res.message.statusCode;
        let err: Error;

        if (statusCode > 299) {
            let obj: any;
            var msg = tl.loc("FailedRequest", statusCode);
            err = new Error(msg);
            err['statusCode'] = statusCode;

            // get the result from the body
            try {
                let result: string = await res.readBody();
                err['result'] = result;
            }
            catch (error) {
                // Invalid contents;  leaving result obj null
            }
        }

        if (!!err) {
            throw err;
        }
    }
}