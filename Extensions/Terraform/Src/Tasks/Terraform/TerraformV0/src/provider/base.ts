import tasks = require('azure-pipelines-task-lib/task');

export abstract class TFProvider {
    protected providerServiceName: string;
    
    constructor() {
        this.providerServiceName = "providerService" + tasks.getInput("provider", true)
        //values are currently only either: azurerm, aws or google
    }
}