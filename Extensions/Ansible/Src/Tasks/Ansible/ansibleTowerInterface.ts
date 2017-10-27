import tl = require("vsts-task-lib/task");
import path = require("path");
import querystring = require('querystring');
import util = require("util");

import { ansibleInterface } from './ansibleInterface';
import {WebRequest, WebResponse, beginRequest} from './ansibleUtils';

export class ansibleTowerInterface extends ansibleInterface {
    constructor() {
        super();
        this.initializeTaskContants();
    }

    public async execute() {
        try {
            this._jobTemplateId = await this.getJobTemplateId();

            var jobId = await this.launchJob();
            var status = await this.updateRunningStatusAndLogs(jobId);
            if (status === 'successful')
                tl.setResult(tl.TaskResult.Succeeded, "");
            else if (status === 'failed')
                tl.setResult(tl.TaskResult.Failed, "");
        }
        catch (error) {
            tl.setResult(tl.TaskResult.Failed, error);
        }
    }

    private initializeTaskContants() {
        try {
            var connectedService = tl.getInput("connectionAnsibleTower", true);
            var endpointAuth = tl.getEndpointAuthorization(connectedService, true);
            this._username = endpointAuth.parameters["username"];
            this._password = endpointAuth.parameters["password"];
            this._hostname = tl.getEndpointUrl(connectedService, true);
            this._jobTemplateName = tl.getInput("jobTemplateName");
            this._lastPolledEvent = 0;

        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, tl.loc("Ansible_ConstructorFailed", error.message));
        }
    }

    private getEmptyRequestData(): string {
        return querystring.stringify({});
    }

    private getBasicRequestHeader(): any {
        var requestHeader: any = {
            "Authorization": "Basic " + new Buffer(this._username + ":" + this._password).toString('base64')
        };
        return requestHeader;
    }

    private getJobLaunchApi(): string {
        var ansibleJobLaunchUrl: string = util.format(this._jobLaunchUrlFormat, this._hostname, this._jobTemplateId);
        return ansibleJobLaunchUrl;
    }

    private getJobApi(jobId: string): string {
        var ansibleJobUrl: string = util.format(this._jobUrlFormat, this._hostname, jobId);
        return ansibleJobUrl;
    }

    private getJobEventApi(jobId: string, pageSize: number, pageNumber: number): string {
        var ansibleJobEventUrl: string = util.format(this._jobEventUrlFormat, this._hostname, jobId, pageSize, pageNumber);
        return ansibleJobEventUrl;
    }

    private async getJobTemplateId(): Promise<string> {

        var jobTemplateId: string = null;
        var request = new WebRequest();
        request.method = 'GET';
        request.uri = util.format(this._jobTemplateIdUrlFormat, this._hostname, this._jobTemplateName);
        request.headers = this.getBasicRequestHeader();
        
        var response = await beginRequest(request);
        if (response.statusCode === 200) {
            jobTemplateId = response.body['results'][0]['id'];
        } else {
            throw (tl.loc('JobTemplateNotPresent', this._jobTemplateName));
        }
        return jobTemplateId;
    }

    private async getJobStatus(jobId: string): Promise<string> {
        var status: string = null;
        var request = new WebRequest();
        request.method = 'GET';
        request.uri = this.getJobApi(jobId);
        request.headers = this.getBasicRequestHeader();
        
        var response = await beginRequest(request);
        if (response.statusCode === 200) {
            status = response.body['status'];
        } else {
            throw (tl.loc('FailedToGetJobDetails', response.statusCode, response.statusMessage));
        }
        return status;
    }

    private async getJobEvents(jobId: string, lastDisplayedEvent: number): Promise<string[]> {
        var stdoutArray: string[] = [];
        var pageSize = 10;
        var pageNumber = Math.floor(lastDisplayedEvent / pageSize + 1);
        var request = new WebRequest();
        request.method = 'GET';
        request.headers = this.getBasicRequestHeader();
        var jobEventUrl = this.getJobEventApi(jobId, pageSize, pageNumber);

        while (jobEventUrl) {
            request.uri = jobEventUrl;
            var response = await beginRequest(request);
            if (response.statusCode === 200) {
                var totalEvents = response.body['count'];
                var results: any[] = response.body['results'];
                var nextPageUrl = response.body['next'];
                results.forEach((event) => {
                    if (event['counter'] > lastDisplayedEvent)
                        stdoutArray[event['counter']] = event['stdout'];
                });
                jobEventUrl = (nextPageUrl != null) ? (this._hostname + nextPageUrl) : null;
            } else {
                throw (tl.loc('FailedToGetJobDetails', response.statusCode, response.statusMessage));
            }
        }

        return stdoutArray;
    }


    private isJobInTerminalState(status: string): boolean {
        return status === 'successful' || status === 'failed';
    }

    private async updateRunningStatusAndLogs(jobId: string): Promise<string> {
        var waitTimeInSeconds = 10;
        var timeElapsed = 0;
        var longRunningJobThreshold = 300;
        var lastDisplayedEvent = 0;
        var status: string = "";
        while (true) {
            status = await this.getJobStatus(jobId);
            if (status !== 'pending') {
                var events = await this.getJobEvents(jobId, lastDisplayedEvent);
                events.forEach((value, index) => {
                    lastDisplayedEvent = index;
                    console.log(value);
                    console.log();
                });
            }
            if (this.isJobInTerminalState(status)) {
                break;
            }

            await this.sleepFor(waitTimeInSeconds);

            timeElapsed += waitTimeInSeconds;
            if (timeElapsed >= longRunningJobThreshold) {
                waitTimeInSeconds = 120;
            }
        }

        return status;
    }

    private async launchJob(): Promise<string> {
        var jobId: string = null;
        var request = new WebRequest();
        request.method = 'POST';
        request.uri = this.getJobLaunchApi();
        request.body = this.getEmptyRequestData();
        request.headers = this.getBasicRequestHeader();

        var response = await beginRequest(request);

        if (response.statusCode === 201) {
            jobId = response.body['id'];
        } else {
            throw (tl.loc('CouldnotLaunchJob', response.statusCode, response.statusMessage));
        }
        return jobId;
    }

    private sleepFor(sleepDurationInSeconds): Promise<any> {
        return new Promise((resolve, reeject) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }

    private _jobLaunchUrlFormat: string = "%s/api/v1/job_templates/%s/launch/";
    private _jobUrlFormat: string = "%s/api/v1/jobs/%s/";
    private _jobEventUrlFormat: string = "%s/api/v1/jobs/%s/job_events/?page_size=%s&page=%s";
    private _jobTemplateIdUrlFormat: string = "%s/api/v1/job_templates/?name__exact=%s";

    private _connectedService: string;
    private _jobTemplateName: string;
    private _jobTemplateId: string;
    private _username: string;
    private _password: string;
    private _hostname: string;
    private _lastPolledEvent: number;
}