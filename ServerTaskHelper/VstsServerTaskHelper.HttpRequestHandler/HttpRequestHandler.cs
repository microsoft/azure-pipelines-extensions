using System;
using System.Collections.Generic;
using System.Threading;
using Microsoft.AspNetCore.Http;
using VstsServerTaskHelper.Core;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.HttpRequestHandler
{
    public class HttpRequestHandler
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly IDictionary<string, string> taskProperties;

        public HttpRequestHandler(ITaskExecutionHandler taskExecutionHandler, IHeaderDictionary requestHeaders)
            :this(taskExecutionHandler, requestHeaders.GetTaskPropertiesDictionary())
        {
        }

        public HttpRequestHandler(ITaskExecutionHandler taskExecutionHandler, IDictionary<string, string> taskProperties)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskProperties = taskProperties;
        }

        public async void Execute(CancellationToken cancellationToken)
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
