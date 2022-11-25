### In this advanced example, Azure Function checks that the Azure Boards ticket referenced by the commit that triggered the pipeline run is completed.

This sample demonstrates the proper integration with Azure DevOps async checks, when the check condition takes a while to be evaluated due to an external dependency.
Async check refers to a check which Completion event setting is configured to Callback.

### The Azure Function goes through the following steps:

1. Confirms the receipt of the check payload
2. Sends a status update to Azure Pipelines that the check started
3. Retrieves Azure Boards ticket referenced in the commit that triggered the pipeline run
4. Checks if the ticket is in the `Completed` state
5. Sends a status update with the result of the check
6. If the ticket isn't in the Completed state, it reschedules another evaluation in 1 minute
7. Once the ticket is in the correct state, it sends a positive decision to Azure Pipelines

### In order for this example to work, following instructions should be followed for the setup:

1. Deploy and configure AzureFunctionAdvancedHandler and AzureFunctionAdvancedServiceBusTrigger on azure portal.
   Both of these functions have to be deployed in order for this example to work because they are dependent of each other.
   AzureFunctionAdvancedHandler is entry point for the check process, where as AzureFunctionAdvancedServiceBusTrigger function
   keeps the check evaluation going in intervals.

2. These functions interact over ServiceBus queue az-advanced-checks-queue. If the work item isn't completed,
   AzureFunctionAdvancedHandler queues a message to this queue which becomes visible in {ChecksEvaluationPeriodInMinutes}
   minutes of time initially set to 1. Once this message becomes active, it triggers AzureFunctionAdvancedServiceBusTrigger
   azure function which consumes it and removes it from the queue. This is how we reschedule another evaluation to happen
   in 1 minute mentioned in step #6.
   => In order for this to work, ServiceBus queue az-advanced-checks-queue must be created!
      OPTIONAL: Message time to live can be set to 10 seconds so that we don't have long overdue hanging messages.
      ![Alt text](Pictures/ServiceBusQueue.png?raw=true "ServiceBus Queue")

3. Configure 3 additional azure function settings, necessary for ServiceBus interaction:
   3.1. "ServiceBusConnection" : "Endpoint=sb://azchecks.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=...="
        Description: ServiceBus Queue connection endpoint
        ![Alt text](Pictures/ServiceBusSharedAccessPolicies.png?raw=true "ServiceBus Queue connection endpoint")
   3.2. "QueueName" : "az-advanced-checks-queue"
        Description: ServiceBus Queue name, should be set to "az-advanced-checks-queue"
   3.3. "ChecksEvaluationPeriodInMinutes" : 1
        Description: Parameter indicating how often check logic will be executed (time between AzureFunctionAdvancedServiceBusTrigger calls)
   ![Alt text](Pictures/AzureFunctionConfiguration.png?raw=true "Configuration settings of advanced azure function")

4. Configure settings on the check of type Invoke Azure Function like so:
   4.1. Azure function URL: URL of the previously deployed AzureFunctionAdvancedHandler
        EXAMPLE: https://azurefunctionadvancedhandler.azurewebsites.net/api/MyAdvancedFunction
   4.2. Headers:
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
   4.3. Completion event: Callback
        NOTE: this makes the check async
   RECOMMENDATIONS:
       * Time between evaluation (minutes) : 0, so that there are no retries
       * Timeout (minutes) to a lower value, so that build times out quickly
   ![Alt text](Pictures/AdvancedCheckAsyncConfig.png?raw=true "Configuration settings for advanced async Invoke Azure Function check")
