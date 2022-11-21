using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System.ComponentModel;
using System.Threading;
using Microsoft.VisualStudio.Services.Identity;
using Microsoft.VisualStudio.Services.Common;
using System.Collections.Generic;
using System.Net.Http.Headers;
using DistributedTask.ServerTask.Remote.Common.Request;
using System.Linq;
using System.Net.Http;
using DistributedTask.ServerTask.Remote.Common;

namespace AzureFunctionAdvancedSample
{
    public static class MyFunction
    {
        [FunctionName("MyFunction")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequestMessage req,
            ILogger log)
        {
            TypeDescriptor.AddAttributes(typeof(IdentityDescriptor), new TypeConverterAttribute(typeof(IdentityDescriptorConverter).FullName));
            TypeDescriptor.AddAttributes(typeof(SubjectDescriptor), new TypeConverterAttribute(typeof(SubjectDescriptorConverter).FullName));
            AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;

            // Get request body
            var messageBody = await req.Content.ReadAsStringAsync().ConfigureAwait(false);

            // Fetch all the VSTS properties from the headers
            var taskProperties = GetTaskProperties(req.Headers);

            // Created task execution handler
            ITaskExecutionHandler myTaskExecutionHandler = new MyBasicTaskExecutionHandler();

            var executionHandler = new ExecutionHandler(myTaskExecutionHandler, messageBody, taskProperties);
#pragma warning disable CS4014 // Because this call is not awaited, execution of the current method continues before the call is completed
            var executionThread = new Thread(() => executionHandler.Execute(CancellationToken.None));
#pragma warning restore CS4014 // Because this call is not awaited, execution of the current method continues before the call is completed
            executionThread.Start();

            return new OkObjectResult("Request accepted!");
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
