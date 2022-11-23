using System;
using System.Threading;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.ServiceBus;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using DistributedTask.ServerTask.Remote.Common.WorkItemProgress;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Newtonsoft.Json;

namespace AzureFunctionAdvancedServiceBusTrigger
{
    public class AzureFunctionAdvancedServiceBusTrigger
    {
        private const string ServiceBusQueueName = "az-advanced-checks-queue";

        [FunctionName("AzureFunctionAdvancedServiceBusTrigger")]
        public static void Run([ServiceBusTrigger(ServiceBusQueueName, Connection = "ServiceBusConnection")] string myQueueItem, ILogger log)
        {
            var taskProperties = JsonConvert.DeserializeObject<TaskProperties>(myQueueItem);
            log.LogInformation($"C# ServiceBus queue trigger function processed message with PlanId: {taskProperties.PlanId}");

            // Step #3: Retrieve Azure Boards ticket referenced in the commit message that triggered the pipeline run
            var witClient = new WorkItemClient(taskProperties);
            var wit = witClient.GetWorkItemById();

            // Step #4: Check if the ticket is in the `Completed` state
            var isWitCompleted = witClient.IsWorkItemCompleted(wit);

            // Step #5: Sends a status update with the result of the check
            var taskClient = new TaskClient(taskProperties);
            LogToChecksConsole(taskClient, $"Referenced work item is completed: {isWitCompleted}");

            if (!isWitCompleted)
            {
                // Step #6: Ticket is not in the correct state, reschedule another evaluation in the configured minutes by the application settings
                SendMessageToQueue(taskClient, log);
            }
            else
            {
                // Step #6: Ticket is in the correct state, send a positive decision to Azure Pipelines
                ReportTaskCompleted(taskClient);
                LogToChecksConsole(taskClient, "Check succeeded!");
            }
        }

        private static void SendMessageToQueue(TaskClient taskClient, ILogger log)
        {
            var connectionString = Environment.GetEnvironmentVariable("ServiceBusConnection");
            var queueName = Environment.GetEnvironmentVariable("QueueName");
            var serviceBusSettings = new ServiceBusSettings(connectionString, queueName);

            var serviceBusClient = new ServiceBusClient(taskClient.TaskProperties, serviceBusSettings);
            var checksEvaluationPeriodInMinutes = Double.Parse(Environment.GetEnvironmentVariable("ChecksEvaluationPeriodInMinutes"));
            var deliveryScheduleTime = DateTime.Now.AddMinutes(checksEvaluationPeriodInMinutes);

            var messageSequenceNumber = serviceBusClient.SendScheduledMessageToQueue(deliveryScheduleTime);
            log.LogInformation($"Message with sequence number {messageSequenceNumber} was successfully sent to the queue!");

            var checksEvaluationMessage = $"Another evaluation has been rescheduled in {checksEvaluationPeriodInMinutes} minute";
            checksEvaluationMessage += (checksEvaluationPeriodInMinutes > 1 ? "s" : "") + "...";
            LogToChecksConsole(taskClient, checksEvaluationMessage);
        }

        private static async void LogToChecksConsole(TaskClient taskClient, string message)
        {
            var taskLogger = new TaskLogger(taskClient.TaskProperties, taskClient);
            await taskLogger.LogImmediately(message);
        }

        private static async void ReportTaskCompleted(TaskClient taskClient)
        {
            await taskClient
                    .ReportTaskCompleted(taskClient.TaskProperties.TaskInstanceId, TaskResult.Succeeded, CancellationToken.None)
                    .ConfigureAwait(false);
        }
    }
}
