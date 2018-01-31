### This library can be consumed by developers who wants to build new tasks/solutions on top of vsts server side task infrastructure. It provides the following capabilities:

1. Ability to report task status updates to vsts like task has started, task has completed with succeess or failure.
2. Ability to report live logs update to vsts.
3. Ability to send log messages in chunks, similar to the vsts-agent, so that you dont face performance issues while downloading the logs and you dont end up making chatty calls to server due to which server can start throttling the calls. 
4. Ability to report gate status.
5. Workarounds for any bugs which another customer has hit.

#### Samples using this library:

|Link to Sample|Description|
|:----:|----|
|[HttpRequestHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/HttpRequestHandler)|This sample demonstrates how you can use this library in your product which is integrating with server tasks via [InvokeRestAPI](https://github.com/Microsoft/vsts-tasks/tree/master/Tasks/InvokeRestApi) task. |
|[ServiceBusMessageHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/ServiceBusMessageHandler)|This sample demonstrates how you can use this library in your product which is integrating with server tasks via [PublishToAzureServiceBus](https://github.com/Microsoft/vsts-tasks/tree/master/Tasks/PublishToAzureServiceBus) task. |
|[AzureFunctionHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/AzureFunctionHandler)|This sample demonstrates how you can use this library in your product which is integrating with server tasks via [AzureFunction](https://github.com/Microsoft/vsts-tasks/tree/master/Tasks/AzureFunction) task. |

#### Important classes in this project:
|Class|Description|
|:----:|----|
|TaskProperties|This contains all the http headers or service bus message properties. We expect all the VSTS properties like planId, jobId,... in this list.| 
|TaskMessage| This contains the message body of the task and is expected to contain the properties/inputs that you require for your task to work.|
|TaskClient|Used by ExecutionHandler to send task status updates|
|TaskLogger|Is supplied to task execution handler, can be used to log messages to server.|
|ExecutionHandler|Is the core class, sends task status updates, invokes ITaskExecutionHandler Execute/Cancel|
|ITaskExecutionHandler|ExecutionHandler invokes Execute/Cancel methods of this interface. Implement this interface with your execution logic and provide it to ExecutionHandler.|

#### Below is the list of required Task properties:
| Task property | Description | 
|:----------:|--------|
| PlanUrl | VSTS Service URL where plan is created. | 
| PlanId | Id of the plan, where job is part of. |
| JobId | Id of the Job, this task is part of. |
| TimelineId | Id of the plan's timeline. | 
| TaskInstanceId | Id of the Task unique per instance. | 
| AuthToken | PAT token used to communicate with VSTS service. |
| HubName | Task hub name, valid values: Build/Release, default value: Release |
| RequestType | Type of the request, valid values: Execute/Cancel, default value: Execute |

#### How you can get started:

1. Implement `ITaskExecutionHandler`
2. Initialize `TaskProperties` with the task related data recieved in Http request headers/ServiceBus message properties for HttpRequest or ServiceBus server task respectively.
3. Save your task input object recieved in Http request body/ServiceBus message body for HttpRequest or ServiceBus server task respectively.
3. Initialize `ExectionHandler` providing taskExecutionHandler, messageBody and taskProperties as inputs
4. Call Execute on ExecutionHandler object

```sh
    ITaskExecutionHandler taskExecutionHandler = new MyTaskExecutionHandler();
    var executionHandler = new ExecutionHandler(taskExecutionHandler, taskMessageBody, taskProperties);
    await executionHandler.Execute(cancellationToken).ConfigureAwait(false);
```


Nuget package of this library is available [here](https://1essharedassets.visualstudio.com/1esPkgs/_packaging?feed=vsts_rm_extensions&_a=feed)