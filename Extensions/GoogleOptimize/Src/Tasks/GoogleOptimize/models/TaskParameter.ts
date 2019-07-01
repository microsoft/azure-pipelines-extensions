import * as tl from 'azure-pipelines-task-lib/task';

export class TaskParameter {
	private _endpoint: string;
	private _accountId: string;
	private _webPropertyId: string;
	private _profileId: string;
	private _experimentId: string;
	private _action: string;
	private _trafficCoverage: string | null;
	private _equalWeighting: string | null;
	private _filePath: string | null;

	private static _taskParameters: TaskParameter = null;

	constructor () {
        this.initializeTaskParameters();
    }

	public static getInstance(): TaskParameter {
        if(TaskParameter._taskParameters == null) {
            TaskParameter._taskParameters = new TaskParameter();
        }
        return TaskParameter._taskParameters;
    }

	private initializeTaskParameters() {
		try {
			this._endpoint = tl.getInput('googleEndpoint', true);
			this._accountId = tl.getInput('accountId', true);
			this._webPropertyId = tl.getInput('webPropertyId', true);
			this._profileId = tl.getInput('profileId', true);
			this._experimentId = (tl.getInput('experimentName', true));
			this._action = tl.getInput('action', true);
			this._trafficCoverage = tl.getInput('trafficCoverage', false);
			this._equalWeighting = tl.getInput('equalWeighting', false);
			this._filePath = tl.getInput('jsonFile', false)
		} catch (error) {
			throw tl.loc("FailedToFetchInputs", error);
		}
	}

	get endpoint(): string {
		return this._endpoint;
	}

	set endpoint(value: string) {
		this._endpoint = value;
	}

	get accountId(): string {
		return this._accountId;
	}

	set accountId(value: string) {
		this._accountId = value;
	}

	get webPropertyId(): string {
		return this._webPropertyId;
	}

	set webPropertyId(value: string) {
		this._webPropertyId = value;
	}

	get profileId(): string {
		return this._profileId;
	}

	set profileId(value: string) {
		this._profileId = value;
	}

	get experimentId(): string {
		return this._experimentId;
	}

	set experimentId(value: string) {
		this._experimentId = value;
	}

	get action(): string {
		return this._action;
	}

	set action(value: string) {
		this._action = value;
	}

	get trafficCoverage(): number | null {
		let traffic = parseFloat(this._trafficCoverage);
		if (Number.isNaN(traffic) || traffic <= 0 || traffic > 1) {
			throw tl.loc("TotalTrafficValueNotValid", this._trafficCoverage);
		}
		return traffic;
	}

	set trafficCoverage(value: number | null) {
		this._trafficCoverage = value;
	}

	get equalWeighting(): boolean | null {
		return (this._equalWeighting === "True");
	}

	set equalWeighting(value: boolean | null ) {
		this._equalWeighting = value;
	}

	get filePath(): string | null {
		return this._filePath;
	}

	set filePath(value: string | null) {
		this._filePath = value;
	}

}
