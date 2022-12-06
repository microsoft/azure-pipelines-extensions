# Advanced Invoke Azure Function Check Example

This advanced example shows how to trigger an Azure Function to fire once a pipeline run ends that was kicked off by a commit with a related [Azure Boards](https://azure.microsoft.com/products/devops/boards/) work item.

Use the [`Invoke Azure Function` check](https://learn.microsoft.com/azure/devops/pipelines/process/approvals?#invoke-azure-function) Azure Function in **Callback (Asynchronous)** mode. This mode is ideal for conditions that can have longer wait times (example: making a REST call).

To successfully run this example, you need to have an Azure Boards work item, an Azure Repo, and a YAML pipeline.

# Structure

The Azure Function goes through the following steps:

1. Confirms the receipt of the check payload
2. Sends a status update to Azure Pipelines that the check started
3. Retrieves the Azure Boards work item referenced in the commit that triggered the pipeline run
4. Checks if the work item is in the `Completed` state
5. Sends a status update with the result of the check
6. If the work item isn't in the `Completed` state, the function will run again in one minute
7. Once the ticket is in the correct state, the function sends a positive decision to Azure Pipelines

The example consists of two Azure Functions working together:
1. `AzureFunctionAdvancedHandler` is the entry point for the check process
2. `AzureFunctionAdvancedServiceBusTrigger` performs the periodic check of the state of the work item

These two functions interact over a [ServiceBus queue](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-service-bus?tabs=in-process%2Cextensionv5%2Cextensionv3&pivots=programming-language-csharp) named `az-advanced-checks-queue`. If the work item isn't completed, 
`AzureFunctionAdvancedHandler` queues a message to this queue. The message becomes active in `{ChecksEvaluationPeriodInMinutes}` minutes (by default, 1 minute), and it triggers `AzureFunctionAdvancedServiceBusTrigger`. The function then consumes the message and removes it from the queue. The function will then be scheduled for a second evaluation in one minute (Step 6).


# Configuration

To use this example as an `Invoke Azure Function` check:
1. Create and configure a ServiceBus named `azchecks`
2. Within the ServiceBus, create and configure the ServiceBus queue namede `az-advanced-checks-queue`
   ![ServiceBus Queue](Pictures/ServiceBusQueue.png?raw=true)
3. Deploy the `AzureFunctionAdvancedServiceBusTrigger` Azure Function
4. Deploy the `AzureFunctionAdvancedHandler` Azure Function
5. Configure the `AzureFunctionAdvancedHandler` Azure Function
   1. Set _ChecksEvaluationPeriodInMinutes_ to 1. This parameter defines how often the check logic will be executed. Practically, the time between `AzureFunctionAdvancedServiceBusTrigger` calls
   ![Configuration settings of advanced azure function](Pictures/AzureFunctionConfiguration.png?raw=true)
   2. Set _ServiceBusConnection_ to _Endpoint=sb://{ServiceBusURL}/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=...=_. You can find this information in the ServiceBus  created in Step 1, under _Settings_, _Shared access policies_. Select _RootManageSharedAccessKey_, and then copy _Primary Connection String_.
      ![ServiceBus Queue connection endpoint](Pictures/ServiceBusSharedAccessPolicies.png?raw=true)
2. In your Azure Pipelines, create a new [`Environment`](https://learn.microsoft.com/azure/devops/pipelines/process/environments) called _Demo_ with no resources
3. Add a Check of type `Invoke Azure Function` to _Demo_ with the following configuration:
   1. _Azure function URL_: the URL of the Azure Function deployed in Step 1, for example, https://azurefunctionbasichandler.azurewebsites.net/api/MyBasicFunction. You can get this URL when you do _Copy Function Url_ in Visual Studio Code
   2. _Function key_: a secret used to access the Azure Function, for example, the value of the _code_ query parameter after you do _Copy Function Url_ in Visual Studio Code
   3. _Headers_:
        ```json
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
           "BuildId": "$(Build.BuildId)"
        }
        ```
        Don't forget to add `"BuildId": "$(Build.BuildId)"`, otherwise your Azure Function check will not work
   4. In the _Advanced_ section, choose _Callback_ as completion event. This makes the check run asynchronously
   5. In the _Control options_ section: 
      1. Set _Time between evaluations (minutes)_ to 0
      2. Set _Timeout (minutes)_ to 5, so that build times out quickly
   6. Your configuration should look like in the following screenshot<br/>
      ![Configuration settings for advanced async Invoke Azure Function check](Pictures/AdvancedCheckAsyncConfig.png?raw=true)

# Run the Check
To see your Invoke Azure Function check in action, follow these steps:

1. Create a work item ticket
2. Create a new YAML pipeline with the following code:
```yml
stages:
- stage: Build
  jobs:
  - job:
    steps:
    - script: echo "Building"

- stage: Deploy
  jobs:
  - deployment: 
    environment: Demo
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Deploying to Demo"
```
2. _Save and run_ your pipeline
3. Go to your pipeline's run details page, authorize it to use the _Demo_ environment
4. Your pipeline will fail, because there is no work item linked to the latest commit
5. Create a work item ticket in Azure Boards
6. Edit the `REAMDE.md` file in the pipeline's repository
7. When you commit your change, link to it the work item ticket you created in Step 5
8. Go to your pipeline's latest run details page
9. Your pipeline is running, but the checks are not passing
10. Click on _0 / 1 checks passed_ in the _Deploy_ stage, and explore the logs of your Invoke Azure Function check
11. Go the work item ticket you created in Step 5 and set it to _Done_ / _Closed_ / _Completed_
12. Go to your pipeline's latest run details page
13. After at most one minute, the check will pass and your pipeline will run
14. Click on _1 / 1 checks passed_ in the _Deploy_ stage, and explore the logs of your Invoke Azure Function check
