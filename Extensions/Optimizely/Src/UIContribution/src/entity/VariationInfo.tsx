export class VariationInfo {
	private name: string;
	private visitorsCount: number;
	private visitorsPercentage: number;
	private totalConversion: number;
	private totalConversionPercentage: number;

	constructor(name: string) {
		this.name = name;
		this.visitorsCount = 0;
		this.visitorsPercentage = 0;
		this.totalConversion = 0;
		this.totalConversionPercentage = 0;
	}

	public getName() {
		return this.name;
	}

	public setVisitorsCount(visitorsCount: number) {
		this.visitorsCount = visitorsCount;
	}

	public getVisitorsCount() {
		return this.visitorsCount;
	}

	public setVisitorsPercentage(visitorsPercentage: number) {
		this.visitorsPercentage = visitorsPercentage;
	}

	public getVisitorsPercentage() {
		return this.visitorsPercentage;
	}

	public setTotalConversion(totalConversion: number) {
		this.totalConversion = totalConversion;
	}

	public getTotalConversion() {
		return this.totalConversion;
	}

	public setTotalConversionPercentage(totalConversionPercentage: number) {
		this.totalConversionPercentage = totalConversionPercentage;
	}

	public getTotalConversionPercentage() {
		return this.totalConversionPercentage;
	}

}
