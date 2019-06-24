import * as tl from 'azure-pipelines-task-lib/task';

export class TaskParameter{
    private  endpoint :string;
    private  accountId :string  ;
    private  webPropertyId : string ;
    private  profileId : string ;
    private  experimentName: string ;
    private  experimentId :string ;
    private  action:string ;
    private  trafficCoverage : string | null;
    private  equalWeighting : string | null;
    private  filePath: string ;

    constructor() {
        try{
            this.endpoint = tl.getInput('googleEndpoint' , true);
            this.accountId = tl.getInput('accountId' , true);
            this.webPropertyId = tl.getInput('webPropertyId' , true);
            this.profileId = tl.getInput('profileId' , true);
            this.experimentId = tl.getInput('experimentName' , true);
            this.experimentName = (tl.getInput('experimentName' , true));
            this.experimentId = (tl.getInput('experimentName' , true));
            this.action = tl.getInput('action' , true);
            this.trafficCoverage = tl.getInput('trafficCoverage' , false);
            this.equalWeighting = tl.getInput('equalWeighting' , false);
            this.filePath = tl.getInput( 'jsonFile', false)
        }
        catch(error) {

            throw new Error("Input gathering failed in parameter.ts");
        }
    }

    public getEndpoint(): string {
        return this.endpoint ;
    }

    public getAccountId() : string{
        return this.accountId ;
    }

    public getWebPropertyId() : string{
        return this.webPropertyId ;
    }

    public getProfileId() : string{
        return this.profileId ;
    }

    public getExperimentId() : string{
        return JSON.parse(this.experimentId).ExperimentId;
    }

    public getAction() : string{
        return this.action ;
    }

    public getTrafficCoverage() : number | null {
        let traffic = parseFloat(this.trafficCoverage)
        if(Number.isNaN(traffic) || traffic <= 0 || traffic > 1){
            throw tl.loc("")
        }
        return traffic ;
    }

    public getEqualWeighting() : boolean | null {
        return (this.equalWeighting === "True") ;
    }

    public getFilePath() : string | null {
        return this.filePath ;
    }

}
