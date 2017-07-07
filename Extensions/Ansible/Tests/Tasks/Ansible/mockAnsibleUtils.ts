import Q = require("q");

export function _writeLine(str) {
    console.log(str);
}
export class DummyClient {
    constructor() {
        console.log("connection to dummy client established");
    }
    end() {
        console.log("connection to dummy client terminated");
    }
}
export class RemoteCommandOptions {
    public failOnStdErr: boolean;
}
export function setupSshClientConnection(cfg) {
    var defer = Q.defer<any>();
    if (cfg.host == 'true dummy host') {
        var client = new this.DummyClient();
        defer.resolve(client);
    }
    else {
        defer.reject("connection to dummy client failed");
    }
    return defer.promise;
}
export function runCommandOnRemoteMachine() {
    var defer = Q.defer<string>();
    this._writeLine("Dummy Logs");
    defer.resolve("0");
    return defer.promise;
}

export class WebResponse {
    public statusCode: number;
    public headers: any;
    public body: any;
    public statusMessage: string;
}

export class WebRequest {
    public method: string;
    public uri: string;
    public body: any;
    public headers: any;
}
export function beginRequest(request) {
    var paths = request.uri.split('/');

    if (paths[3] == 'job_templates' && paths[5] != 'launch') {
        var body =`{
                    "count": 1,
                    "results": [
                        {
                            "id": 9,
                            "type": "job_template",
                            "url": "/api/v1/job_templates/9/" 
                        }
                    ]
                }`;
        var res = new WebResponse();
        res.statusCode = 200;
        res.body = JSON.parse(body);
        return res;
    }
    if(paths[3] == 'job_templates' && paths[5] == 'launch') {
        var body = `{
                        "id": 559,
                        "type": "job",
                        "url": "/api/v1/jobs/559/"
                    }`;
        var res = new WebResponse();
        res.statusCode = 201;
        res.body = JSON.parse(body);
        return res;
    }
    if(paths[3] == 'jobs' && paths[5] != 'job_events') {
        var body = `{
                        "id": 559,
                        "type": "job",
                        "url": "/api/v1/jobs/559/",
                        "status": "successful"
                    }`;
        var res = new WebResponse();
        res.statusCode = 200;
        res.body = JSON.parse(body);
        return res;
    }
    if(paths[3] == 'jobs' && paths[5] == 'job_events') {
        var body = `{
                        "count": 3,
                        "next": null,
                        "previous": null,
                        "results": [
                            {
                                "id": 5813,
                                "type": "job_event",
                                "job": 559,
                                "counter": 2,
                                "stdout": "Dummy stdout 2"
                            },
                            {
                                "id": 5814,
                                "type": "job_event",
                                "job": 559,
                                "counter": 1,
                                "stdout": "Dummy stdout 1"
                            },      
                            {
                                "id": 5815,
                                "type": "job_event",
                                "job": 559,
                                "counter": 3,
                                "stdout": "Dummy stdout 3"
                            }  
                        ]
                    }`;
        var res = new WebResponse();
        res.statusCode = 200;
        res.body = JSON.parse(body);
        return res;
    }
}