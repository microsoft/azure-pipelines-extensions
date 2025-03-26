using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.ServiceBus;
using DistributedTask.ServerTask.Remote.Common.WorkItemProgress;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.Identity;

namespace AzureFunctionAdvancedHandler
{
    public class MyAdvancedFunction
    {
        private readonly ServiceBusSettings _serviceBusSettings;
        public MyAdvancedFunction()
        {
            var connectionString = Environment.GetEnvironmentVariable("ServiceBusConnection");
            var queueName = WorkItemClient.ServiceBusQueueName;
            _serviceBusSettings = new ServiceBusSettings(connectionString, queueName);
        }

        [FunctionName("MyAdvancedFunction")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)] HttpRequestMessage req, ILogger log)
        {
            TypeDescriptor.AddAttributes(typeof(IdentityDescriptor), new TypeConverterAttribute(typeof(IdentityDescriptorConverter).FullName));
            TypeDescriptor.AddAttributes(typeof(SubjectDescriptor), new TypeConverterAttribute(typeof(SubjectDescriptorConverter).FullName));
            AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;

            log.LogInformation(req.ToString());

            // Get request body
            var messageBody = await req.Content.ReadAsStringAsync().ConfigureAwait(false);

            // Fetch all the VSTS properties from the headers
            var taskProperties = GetTaskProperties(req.Headers);

            // Created task execution handler
            Task.Run(() =>
            {
                var executionHandler = new WorkItemStatusHandler(taskProperties, _serviceBusSettings);
                _ = executionHandler.Execute(log, CancellationToken.None).Result;
            });

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
