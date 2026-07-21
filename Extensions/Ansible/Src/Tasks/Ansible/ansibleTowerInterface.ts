import querystring = require('querystring');
import util = require("util");

import tl = require("azure-pipelines-task-lib/task");

import { ansibleInterface } from './ansibleInterface';
import { WebRequest, beginRequest } from './ansibleUtils';

interface JobEventResult {
    counter: number;
    stdout: string;
}

interface JobEventResponse {
    results: JobEventResult[];
    next: string | null;
}

interface JobTemplateResponse {
    results: {
        id: string
    }[];
}

interface JobStatusResponse {
    status: string;
}

export class ansibleTowerInterface extends ansibleInterface {
    constructor() {
        super();
        this.initializeTaskContants();
    }

    public async execute() {
        try {
            this._jobTemplateId = await this.getJobTemplateId();

            const jobId = await this.launchJob();
            const status = await this.updateRunningStatusAndLogs(jobId);

            if (status === 'successful') {
                tl.setResult(tl.TaskResult.Succeeded, "");
            } else if (status === 'failed') {
                tl.setResult(tl.TaskResult.Failed, "");
            }
        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, error);
        }
    }

    private initializeTaskContants() {
        try {
            const connectedService = tl.getInputRequired("connectionAnsibleTower");
            const endpointAuth = tl.getEndpointAuthorization(connectedService, true);

            this._username = endpointAuth?.parameters["username"];
            this._password = endpointAuth?.parameters["password"];
            this._hostname = tl.getEndpointUrl(connectedService, true);

            // Register credentials with the log masker so they are redacted in pipeline logs
            try {
                // @ts-ignore setSecret correctly handles undefined/null values
                tl.setSecret(this._password);
            } catch {
                tl.warning('Failed to mask Ansible Tower password for log redaction.');
            }
            this._jobTemplateName = tl.getInputRequired("jobTemplateName");
        } catch (error) {
            tl.setResult(tl.TaskResult.Failed, tl.loc("Ansible_ConstructorFailed", error.message));
        }
    }

    private getEmptyRequestData(): string {
        return querystring.stringify({});
    }

    private getBasicRequestHeader(): any {
        const authToken = Buffer.from(this._username + ":" + this._password).toString('base64');

        try {
            tl.setSecret(authToken);
        } catch {
            tl.warning('Failed to mask auth token for log redaction.');
        }

        return {
            "Authorization": "Basic " + authToken
        };
    }

    private getJobLaunchApi() {
        return util.format(this._jobLaunchUrlFormat, this._hostname, this._jobTemplateId);
    }

    private getJobApi(jobId: string): string {
        return util.format(this._jobUrlFormat, this._hostname, jobId);
    }

    private getJobEventApi(jobId: string, pageSize: number, pageNumber: number): string {
        return util.format(this._jobEventUrlFormat, this._hostname, jobId, pageSize, pageNumber);
    }

    private async getJobTemplateId(): Promise<string> {
        const request = new WebRequest();
        request.method = 'GET';
        request.uri = util.format(this._jobTemplateIdUrlFormat, this._hostname, this._jobTemplateName);
        request.headers = this.getBasicRequestHeader();

        const response = await beginRequest<JobTemplateResponse>(request);

        if (response.statusCode !== 200 || !response.body?.['results']?.[0]) {
            throw (tl.loc('JobTemplateNotPresent', this._jobTemplateName));
        }

        return response.body!['results'][0]['id'];
    }

    private async getJobStatus(jobId: string): Promise<string> {
        const request = new WebRequest();
        request.method = 'GET';
        request.uri = this.getJobApi(jobId);
        request.headers = this.getBasicRequestHeader();

        const response = await beginRequest<JobStatusResponse>(request);

        if (response.statusCode !== 200) {
            throw (tl.loc('FailedToGetJobDetails', response.statusCode, response.statusMessage));
        }

        return response.body!['status'];
    }

    private async getJobEvents(jobId: string, lastDisplayedEvent: number): Promise<string[]> {
        const stdoutArray: string[] = [];
        const pageSize = 10;
        const pageNumber = Math.floor(lastDisplayedEvent / pageSize + 1);
        const request = new WebRequest();
        request.method = 'GET';
        request.headers = this.getBasicRequestHeader();
        let jobEventUrl: string | null = this.getJobEventApi(jobId, pageSize, pageNumber);

        while (jobEventUrl) {
            request.uri = jobEventUrl;
            const response = await beginRequest<JobEventResponse>(request);
            if (response.statusCode === 200) {
                const results: JobEventResult[] = response.body!['results'];
                const nextPageUrl = response.body!['next'];
                results.forEach((event) => {
                    if (event['counter'] > lastDisplayedEvent)
                        stdoutArray[event['counter']] = event['stdout'];
                });
                jobEventUrl = (nextPageUrl != null) ? (this._hostname! + nextPageUrl) : null;
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
        let waitTimeInSeconds = 10;
        let timeElapsed = 0;
        const longRunningJobThreshold = 300;
        let lastDisplayedEvent = 0;
        let status = "";

        while (true) {
            status = await this.getJobStatus(jobId);
            if (status !== 'pending') {
                const events = await this.getJobEvents(jobId, lastDisplayedEvent);
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
        const request = new WebRequest();
        request.method = 'POST';
        request.uri = this.getJobLaunchApi();
        request.body = this.getEmptyRequestData();
        request.headers = this.getBasicRequestHeader();

        const response = await beginRequest<{ id: string }>(request);

        if (response.statusCode !== 201 || !response.body) {
            throw (tl.loc('CouldnotLaunchJob', response.statusCode, response.statusMessage));
        }

        return response.body['id'];
    }

    private sleepFor(sleepDurationInSeconds: number): Promise<any> {
        return new Promise(resolve => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }

    private _jobLaunchUrlFormat = "%s/api/v1/job_templates/%s/launch/";
    private _jobUrlFormat = "%s/api/v1/jobs/%s/";
    private _jobEventUrlFormat = "%s/api/v1/jobs/%s/job_events/?page_size=%s&page=%s";
    private _jobTemplateIdUrlFormat = "%s/api/v1/job_templates/?name__exact=%s";

    private _jobTemplateName: string | undefined;
    private _jobTemplateId = "";
    private _username: string | undefined;
    private _password: string | undefined;
    private _hostname: string | undefined;
}