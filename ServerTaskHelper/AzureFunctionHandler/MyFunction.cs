using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.Identity;

namespace AzureFunctionHandler
{
    public static class MyFunction
    {
        [FunctionName("MyFunction")]
        public static async Task<HttpResponseMessage> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)]HttpRequestMessage req, TraceWriter log)
        {
            TypeDescriptor.AddAttributes(typeof(IdentityDescriptor), new TypeConverterAttribute(typeof(IdentityDescriptorConverter).FullName));
            TypeDescriptor.AddAttributes(typeof(SubjectDescriptor), new TypeConverterAttribute(typeof(SubjectDescriptorConverter).FullName));
            AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;

            // Get request body
            var messageBody = await req.Content.ReadAsStringAsync().ConfigureAwait(false);

            // Since we expect all the VSTS properties to be in the request headers, fetch them from the headers
            //
            var taskProperties = GetTaskProperties(req.Headers);

            // Create my own task execution handler. You should replace it with your task execution handler. 
            ITaskExecutionHandler myTaskExecutionHandler = new MyTaskExecutionHandler();

            var executionHandler = new ExecutionHandler(myTaskExecutionHandler, messageBody, taskProperties);
            var executionThread = new Thread(() => executionHandler.Execute(CancellationToken.None));
            executionThread.Start();

            return req.CreateResponse(HttpStatusCode.OK, "Request accepted!");
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

        private static System.Reflection.Assembly CurrentDomain_AssemblyResolve(object sender, ResolveEventArgs args)
        {
            if (args.Name.StartsWith("Microsoft.VisualStudio.Services.WebApi"))
            {
                return typeof(IdentityDescriptor).Assembly;
            }
            return null;
        }
    }
}
