### This library simplifies handling server task requests from VSTS, by doing the following:

1. Allow plugin your execution handler
2. Send status updates like TaskStarted, TaskCompleted with Succeeded/Failed result
3. Provides a task logger to your execution handler, can be used to log messages back to VSTS

#### To achieve this:
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

Please refer to [HttpRequestHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/HttpRequestHandler), [ServiceBusMessageHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/ServiceBusMessageHandler) and [AzureFunctionHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/AzureFunctionHandler) to understand more.

Important classes in this project:
|Class|Description|
|:----:|----|
|ExecutionHandler|Is the core class, sends task status updates, invokes ITaskExecutionHandler Execute/Cancel|
|ITaskExecutionHandler|ExecutionHandler invokes Execute/Cancel methods of this interface. Implement this interface with your execution logic and provide it to ExecutionHandler.|
|TaskMessage|Is supplied to task execution handler, can be used to retrieve message body and also task properties if required.|
|TaskLogger|Is supplied to task execution handler, can be used to log messages to server.|
|TaskProperties|Ensures all required task properties are available| 
|TaskClient|Used by ExecutionHandler to send task status updates|

Nuget package of this library is available [here](https://1essharedassets.visualstudio.com/1esPkgs/_packaging?feed=vsts_rm_extensions&_a=feed)