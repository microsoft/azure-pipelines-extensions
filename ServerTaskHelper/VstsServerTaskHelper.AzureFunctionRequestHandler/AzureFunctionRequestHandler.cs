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
        private readonly IDictionary<string, string> taskProperties;

        public AzureFunctionRequestHandler(ITaskExecutionHandler taskExecutionHandler, HttpRequestHeaders requestHeaders)
            :this(taskExecutionHandler, requestHeaders.GetTaskPropertiesDictionary())
        {
        }

        public AzureFunctionRequestHandler(ITaskExecutionHandler taskExecutionHandler, IDictionary<string, string> taskProperties)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskProperties = taskProperties;
        }

        public void Execute(CancellationToken cancellationToken)
        {
            var executionHandler = new ExecutionHandler(taskExecutionHandler, taskProperties);
            executionHandler.Execute(cancellationToken);
        }

        public void Cancel(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }        
    }
}
