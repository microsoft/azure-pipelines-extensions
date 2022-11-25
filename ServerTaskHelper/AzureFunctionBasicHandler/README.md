### In this basic example, Azure Function checks that the that the invoking pipeline contains at least one CmdLine task in the previous stages prior to the check point.

This sample demonstrates the proper integration with Azure DevOps async checks, when the check condition takes a while to be evaluated due to an external dependency.
Async check refers to a check which Completion event setting is configured to Callback.

### The Azure Function goes through the following steps:

1. Confirms the receipt of the check payload
2. Sends a status update to Azure Pipelines that the check started
3. Uses {AuthToken} to make a callback into Azure Pipelines to retrieve the pipeline run's Timeline entry
4. Checks if the Timeline contains a CmdLine task
5. Sends a status update with the result of the search
6. Sends a check decision to Azure Pipelines

### In order for this example to work, following instructions should be followed for the setup:
1. Deploy azure function AzureFunctionBasicHandler to azure.

2. Configure settings on the check of type Invoke Azure Function like so:
   2.1. Azure function URL: URL of the previously deployed AzureFunctionBasicHandler
        EXAMPLE: https://azurefunctionbasichandler.azurewebsites.net/api/MyBasicFunction
   2.2. Headers:
        {
           "Content-Type":"application/json", 
           "PlanUrl": "$(system.CollectionUri)", 
           "ProjectId": "$(system.TeamProjectId)", 
           "HubName": "$(system.HostType)", 
           "PlanId": "$(system.PlanId)", 
           "JobId": "$(system.JobId)", 
           "TimelineId": "$(system.TimelineId)", 
           "TaskInstanceId": "$(system.TaskInstanceId)", 
           "AuthToken": "$(system.AccessToken)",
           "BuildId": "$(Build.BuildId)" => NOTE: this header needs to be appended, will not be generated automatically
        }
   2.3. Completion event: Callback
        NOTE: this makes the check async
   RECOMMENDATIONS:
       * Time between evaluation (minutes) : 0, so that there are no retries
       * Timeout (minutes) to a lower value, so that build times out quickly
   ![Alt text](Pictures/BasicCheckAsyncConfiguration.png?raw=true "Configuration settings for basic async Invoke Azure Function check")
