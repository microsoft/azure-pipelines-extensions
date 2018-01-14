using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Threading;
using VstsServerTaskHelper.Core;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.AzureFunctionRequestHandler
{
    public class AzureFunctionRequestHandler
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly TaskMessage taskMessage;

        public AzureFunctionRequestHandler(ITaskExecutionHandler taskExecutionHandler, string messageBody, HttpRequestHeaders requestHeaders)
            :this(taskExecutionHandler, messageBody, requestHeaders.GetTaskPropertiesDictionary())
        {
        }

        public AzureFunctionRequestHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, IDictionary<string, string> taskProperties)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            taskMessage = new TaskMessage(taskMessageBody, new TaskProperties(taskProperties));
        }

        public void Execute(CancellationToken cancellationToken)
        {
            var executionHandler = new ExecutionHandler(taskExecutionHandler, taskMessage);
            executionHandler.Execute(cancellationToken);
        }

        public void Cancel(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }        
    }
}
