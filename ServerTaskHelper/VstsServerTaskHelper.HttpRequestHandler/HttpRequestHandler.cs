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
        private readonly ITaskMessage taskMessage;

        public HttpRequestHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, IHeaderDictionary requestHeaders)
            :this(taskExecutionHandler, taskMessageBody, requestHeaders.GetTaskPropertiesDictionary())
        {
        }

        public HttpRequestHandler(ITaskExecutionHandler taskExecutionHandler, string taskMessageBody, IDictionary<string, string> taskProperties)
            :this(taskExecutionHandler, GetTaskMessage(taskMessageBody, taskProperties))
        {
        }

        public HttpRequestHandler(ITaskExecutionHandler taskExecutionHandler, ITaskMessage taskMessage)
        {
            this.taskExecutionHandler = taskExecutionHandler;
            this.taskMessage = taskMessage;
        }

        public void Execute(CancellationToken cancellationToken)
        {
            var executionHandler = new ExecutionHandler(taskExecutionHandler, this.taskMessage);
            executionHandler.Execute(cancellationToken);
        }

        public void Cancel(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        private static TaskMessage GetTaskMessage(string taskMessageBody, IDictionary<string, string> taskPropertiesDictionary)
        {
            var taskProperties = new TaskProperties(taskPropertiesDictionary);
            return new TaskMessage(taskMessageBody, taskProperties);
        }
    }
}
