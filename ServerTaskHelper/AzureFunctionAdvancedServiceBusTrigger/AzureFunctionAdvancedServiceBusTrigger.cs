using System;
using System.ComponentModel;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.ServiceBus;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.Identity;
using Newtonsoft.Json;

namespace AzureFunctionAdvancedServiceBusTrigger
{
    public class AzureFunctionAdvancedServiceBusTrigger
    {
        private const string ServiceBusQueueName = "az-advanced-checks-queue";
        private readonly ServiceBusSettings _serviceBusSettings;
        public AzureFunctionAdvancedServiceBusTrigger()
        {
            var connectionString = Environment.GetEnvironmentVariable("ServiceBusConnection");
            var queueName = Environment.GetEnvironmentVariable("QueueName");
            _serviceBusSettings = new ServiceBusSettings(connectionString, queueName);
        }

        [FunctionName("AzureFunctionAdvancedServiceBusTrigger")]
        public async Task Run([ServiceBusTrigger(ServiceBusQueueName, Connection = "ServiceBusConnection")] string myQueueItem, ILogger log)
        {
            var taskProperties = JsonConvert.DeserializeObject<TaskProperties>(myQueueItem);
            log.LogInformation($"C# ServiceBus queue trigger function processed message with PlanId: {taskProperties.PlanId}");

            TypeDescriptor.AddAttributes(typeof(IdentityDescriptor), new TypeConverterAttribute(typeof(IdentityDescriptorConverter).FullName));
            TypeDescriptor.AddAttributes(typeof(SubjectDescriptor), new TypeConverterAttribute(typeof(SubjectDescriptorConverter).FullName));
            AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;

            var executionHandler = new WorkItemStatusHandler(taskProperties, _serviceBusSettings);
            _ = await executionHandler.Execute(log, CancellationToken.None);
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
