### This is a sample app demonstrates how to plugin an execution handler for a ServiceBus server task using DistributedTask.ServerTask.Remote.Common library.

#### Sample app does the following:
1. Implement my own `ITaskExecutionHandler`, `MyTaskExecutionHandler`, which deserialize the input object and log a message to VSTS using TaskLogger.
2. Read service bus settings, connection string and queue name from appsettings.json.
3. Initialize `ServiceBusMessageListener` providing service bus settings and my task execution handler as inputs.
4. Register message handler using `QueueClient.RegisterMessageHandler`
5. On receiving service bus message, initialize `ExecutionHandler` providing my task execution handler, service bus message body and message properties.
6. Call `ExecutionHandler.Execute` method
7. on completion of `Execute`, call `QueueClient.CompleteAsync` so that service bus message will be marked as processed and deleted.
