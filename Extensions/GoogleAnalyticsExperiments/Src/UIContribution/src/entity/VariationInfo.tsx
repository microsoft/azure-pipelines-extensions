export class VariationInfo {
	private Name: string;
	private Sessions: number;
	private PageViews: number;
	private BounceRate: number;
	private AdditionalMetricName: string;
	private AdditionalMetric: number;

	constructor(name: string) {
		this.Name = name;
		this.Sessions = 0;
		this.PageViews = 0;
		this.BounceRate = 0;
		this.AdditionalMetric = null;
		this.AdditionalMetricName = null;
	}

	get name() {
		return this.Name;
	}

	set sessions(value: number) {
		this.Sessions = value;
	}

	get sessions() {
		return this.Sessions;
	}

	set pageViews(value: number) {
		this.PageViews = value;
	}

	get pageViews() {
		return this.PageViews;
	}

	set bounceRate(value: number) {
		this.BounceRate = value;
	}

	get bounceRate() {
		return this.BounceRate;
	}

	set additionalMetric(value: number) {
		this.AdditionalMetric = value;
	}

	get additionalMetric() {
		return this.AdditionalMetric;
	}

	set additionalMetricName(value: string) {
		this.AdditionalMetricName = value;
	}

	get additionalMetricName() {
		return this.AdditionalMetricName;
	}

}
