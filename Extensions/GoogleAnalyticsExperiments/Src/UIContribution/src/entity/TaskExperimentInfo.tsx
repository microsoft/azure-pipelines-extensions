export class TaskExperimentInfo {
	private ExperimentId: string;
	private EndpointId: string;
	private AccountId: string;
	private WebPropertyId: string;
	private ProfileId: string;

	constructor(experimentId: string, endpointId: string, accountId: string, webPropertyId: string, profileId: string) {
		this.ExperimentId = experimentId;
		this.EndpointId = endpointId;
		this.AccountId = accountId;
		this.WebPropertyId = webPropertyId;
		this.ProfileId = profileId;
	}

	set experimentId(experimentId: string) {
		this.ExperimentId = experimentId;
	}

	get experimentId() {
		return this.ExperimentId;
	}

	set endpointId(endpointId: string) {
		this.EndpointId = endpointId;
	}

	get endpointId() {
		return this.EndpointId;
	}

	set accountId(accountId: string) {
		this.AccountId = accountId;
	}

	get accountId() {
		return this.AccountId;
	}

	set webPropertyId(webPropertyId: string) {
		this.WebPropertyId = webPropertyId;
	}

	get webPropertyId() {
		return this.WebPropertyId;
	}

	set profileId(profileId: string) {
		this.ProfileId = profileId;
	}

	get profileId() {
		return this.ProfileId;
	}

}
