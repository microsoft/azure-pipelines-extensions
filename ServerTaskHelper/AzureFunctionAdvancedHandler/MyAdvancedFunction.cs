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

namespace AzureFunctionAdvancedHandler
{
    public static class MyAdvancedFunction
    {
        [FunctionName("MyAdvancedFunction")]
        public static async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequestMessage req, ILogger log)
        {
            TypeDescriptor.AddAttributes(typeof(IdentityDescriptor), new TypeConverterAttribute(typeof(IdentityDescriptorConverter).FullName));
            TypeDescriptor.AddAttributes(typeof(SubjectDescriptor), new TypeConverterAttribute(typeof(SubjectDescriptorConverter).FullName));
            AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;

            // Get request body
            var messageBody = await req.Content.ReadAsStringAsync().ConfigureAwait(false);

            // Fetch all the VSTS properties from the headers
            var taskProperties = GetTaskProperties(req.Headers);

            // Created task execution handler
            Task.Run(() =>
            {
                ITaskExecutionHandler myTaskExecutionHandler = new MyTaskExecutionHandler(taskProperties);
                var executionHandler = new ExecutionHandler(myTaskExecutionHandler, messageBody, taskProperties);
                executionHandler.Execute(CancellationToken.None);
            })
            // log errors in case there are some
            .ContinueWith(task => log.LogInformation(task.Exception.Message), TaskContinuationOptions.OnlyOnFaulted)
            // control is kept with the spawned off thread and not returned to the main one
            .ConfigureAwait(false);

            // Step #1: Confirms the receipt of the check payload
            return new OkObjectResult("Request accepted!");
        }

        private static TaskProperties GetTaskProperties(HttpRequestHeaders requestHeaders)
        {
            IDictionary<string, string> taskProperties = new Dictionary<string, string>();

            foreach (var requestHeader in requestHeaders)
            {
                taskProperties.Add(requestHeader.Key, requestHeader.Value.First());
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
