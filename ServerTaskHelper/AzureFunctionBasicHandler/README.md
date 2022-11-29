# Basic Invoke Azure Function Check Example
 
This basic example shows an Azure Function that checks if a pipeline run has executed at least one [`CmdLine` task](https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/cmd-line-v2). 

You should use this Azure Function in an [`Invoke Azure Function` check](https://learn.microsoft.com/azure/devops/pipelines/process/approvals?#invoke-azure-function) configured in **Callback (Asynchronous)** mode. This mode is ideal when evaluating a condition takes a while, for example, due to making a REST call.

To successfully run this example, your pipeline needs to have at least two stages: a first stage that executes at least one [`CmdLine` task](https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/cmd-line-v2), and a second stage that uses a resource on which you configured the `Invoke Azure Function` check.

# Steps 

The Azure Function goes through the following steps:

1. Confirms the receipt of the check payload
2. Sends a status update to Azure Pipelines that the check started
3. Uses `{AuthToken}` to make a call into Azure Pipelines to retrieve the pipeline run's [`Timeline`](https://learn.microsoft.com/rest/api/azure/devops/build/timeline/get) entry
4. Checks if the `Timeline` contains a `CmdLine` task
5. Sends a status update with the result of the search
6. Sends a check decision to Azure Pipelines

# Configuration

Follow these instructions to use this example as an `Invoke Azure Function` check:
1. Deploy the `AzureFunctionBasicHandler` Azure Function
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
   3. In the _Advanced_ section, choose _Callback_ as completion event. This makes the check run asychnronously
   4. In the _Control options_ section: 
      1. Set _Time between evaluations (minutes)_ to 0
      2. Set _Timeout (minutes)_ to 5, so that build times out quickly
   5. Your configuration should look like in the following screenshot<br/>
      ![Configuration settings for basic async Invoke Azure Function check](Pictures/BasicCheckAsyncConfiguration.png?raw=true)
4. Create a new YAML pipeline with the following code:
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
    environment: Dev
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Deploying to Demo"
```
5. _Save and run_ your pipeline
6. Go to your pipeline's run details page, authorize it to use the _Demo_ environment
7. Wait for your pipeline to run successfully
8. Click on _1 check passed_ and explore the logs of your Invoke Azure Function check

   
