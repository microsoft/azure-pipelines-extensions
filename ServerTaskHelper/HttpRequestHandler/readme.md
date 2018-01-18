### This is a sample app demonstrates how to plugin an execution handler for a HttpRequest server task using DistributedTask.ServerTask.Remote.Common library.

#### Sample app does the following:
1. Recieve VSTS Task related properties in Http request headers
2. Recieve your object in Http request body
3. Implement my own ITaskExecutionHandler, MyTaskExecutionHandler, which deserialize the input object and log a message to VSTS using TaskLogger.
4. Construct ExecutionHandler providing MyTaskExecutionHandler object, messageBody and taskProperties as input
5. Invoke ExecutionHandler.Execute in a new thread, to make it run asynchronously.

