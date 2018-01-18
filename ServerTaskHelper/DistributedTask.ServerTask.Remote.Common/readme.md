### This library does the following:

1. Accept your execution handler, message body/execution input and Task related properties from VSTS
2. Send status updates like TaskStarted, TaskCompleted with Succeeded/Failed result
3. Provides a task logger to your execution handler, can be used to log messages back to VSTS

#### To achieve this:
1. Implement ITaskExecutionHandler
2. Initialize TaskProperties with the task related data recieved in Http request headers/ServiceBus message properties for HttpRequest or ServiceBus server task respectively.
3. Save your task input object recieved in Http request body/ServiceBus message body for HttpRequest or ServiceBus server task respectively.
3. Construct ExectionHandler providing taskExecutionHandler, messageBody and taskProperties as inputs
4. Call Execute on ExecutionHandler object

```sh
    ITaskExecutionHandler taskExecutionHandler = new MyTaskExecutionHandler();
    var executionHandler = new ExecutionHandler(taskExecutionHandler, taskMessageBody, taskProperties);
    await executionHandler.Execute(cancellationToken).ConfigureAwait(false);
```

Please refer to [HttpRequestHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/HttpRequestHandler), [ServiceBusMessageHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/ServiceBusMessageHandler) and [AzureFunctionHandler](https://github.com/Microsoft/vsts-rm-extensions/tree/master/ServerTaskHelper/AzureFunctionHandler) to understand more.
