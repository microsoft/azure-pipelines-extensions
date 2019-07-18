import * as tl from 'azure-pipelines-task-lib/task';

export class TaskParameter {
	private _endpoint: string;
	private _accountId: string;
	private _webPropertyId: string;
	private _profileId: string;
	private _experimentId: string;
	private _action: string;
	private _trafficCoverage: number | null;
	private _equalWeighting: string;
	private _filePath: string;

	private static _taskParameters: TaskParameter = null;

	private constructor () {
        this.initializeTaskParameters();
    }

	public const Status = {
		RUNNING: "RUNNING",
		ENDED: "ENDED",
		DRAFT: "DRAFT",
		READY_TO_RUN: "READY_TO_RUN"
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

			let trafficInput = tl.getInput('trafficCoverage', false);
			let traffic = parseFloat(trafficInput);
			if (trafficInput != null && Number.isNaN(traffic) || traffic <= 0 || traffic > 1) {
				throw tl.loc("TotalTrafficValueNotValid", trafficInput);
			}

			this._trafficCoverage = traffic;

			this._equalWeighting = tl.getInput('equalWeighting', false);
			this._filePath = tl.getInput('jsonFile', false)
		} catch (error) {
			throw tl.loc("FailedToFetchInputs", error);
		}
	}

	get endpoint(): string {
		return this._endpoint;
	}

	get accountId(): string {
		return this._accountId;
	}

	get webPropertyId(): string {
		return this._webPropertyId;
	}

	get profileId(): string {
		return this._profileId;
	}

	get experimentId(): string {
		return this._experimentId;
	}

	get action(): string {
		return this._action;
	}

	get trafficCoverage(): number | null {
		return this._trafficCoverage;
	}

	get equalWeighting(): boolean {
		return (this._equalWeighting === "True");
	}

	get filePath(): string {
		return this._filePath;
	}

}
