import { VariationInfo } from "./VariationInfo";

export class ExperimentCardInfo {

	private ExperimentId: string;
	private ExperimentName: string;
	private AccountId: string;
	private InternalWebPropertyId: string;
	private ProfileId: string;
	private Winner: string;
	private VariationInfos: VariationInfo[];

	constructor(experimentId: string, experimentName: string, accountId: string, internalWebPropertyId: string, profileId: string) {
		this.ExperimentId = experimentId;
		this.ExperimentName = experimentName;
		this.AccountId = accountId;
		this.InternalWebPropertyId = internalWebPropertyId;
		this.ProfileId = profileId;
		this.Winner = null;
		this.VariationInfos = [];
	}

	set experimentId(experimentId: string) {
		this.ExperimentId = experimentId;
	}

	get experimentId() {
		return this.ExperimentId;
	}

	get experimentName() {
		return this.ExperimentName;
	}

	set accountId(accountId: string) {
		this.AccountId = accountId;
	}

	get accountId() {
		return this.AccountId;
	}

	set internalWebPropertyId(internalWebPropertyId: string) {
		this.InternalWebPropertyId = internalWebPropertyId;
	}

	get internalWebPropertyId() {
		return this.InternalWebPropertyId;
	}

	set profileId(profileId: string) {
		this.ProfileId = profileId;
	}

	get profileId() {
		return this.ProfileId;
	}

	get winner() {
		return this.Winner;
	}

	set winner(value: string ) {
		this.Winner = value;
	}

	public addVariationInfo(variationInfo: VariationInfo) {
		this.variationInfos.push(variationInfo);
	}

	get variationInfos() {
		return this.VariationInfos;
	}
}
