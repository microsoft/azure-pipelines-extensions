using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;
using VstsServerTaskHelper.Core;
using VstsServerTaskHelper.Core.Request;

namespace AzureFunctionHandler
{
    public static class MyFunction
    {
        [FunctionName("MyFunction")]
        public static async Task<HttpResponseMessage> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)]HttpRequestMessage req, TraceWriter log)
        {
            // Get request body
            var messageBody = await req.Content.ReadAsStringAsync().ConfigureAwait(false);

            // Since we expect all the VSTS properties to be in the request headers, fetch them from the headers
            //
            var taskProperties = GetTaskProperties(req.Headers);
            var taskMessage = new TaskMessage(messageBody, taskProperties);

            // Create my own task execution handler. You should replace it with your task execution handler. 
            ITaskExecutionHandler myTaskExecutionHandler = new MyTaskExecutionHandler();

            var executionHandler = new ExecutionHandler(myTaskExecutionHandler, taskMessage);
            var executionThread = new Thread(() => executionHandler.Execute(CancellationToken.None));
            executionThread.Start();

            return req.CreateResponse(HttpStatusCode.OK, $"Request accepted!");
        }

        private static TaskProperties GetTaskProperties(HttpRequestHeaders requestHeaders)
        {
            IDictionary<string, string> taskProperties = new Dictionary<string, string>();

            foreach (var taskProperty in TaskProperties.PropertiesList)
            {
                if (requestHeaders.TryGetValues(taskProperty, out var propertyValues))
                {
                    taskProperties.Add(taskProperty, propertyValues.First());
                }
            }

            return new TaskProperties(taskProperties);
        }
    }
}
