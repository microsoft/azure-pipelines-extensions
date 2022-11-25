using System;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.ServiceBus;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using DistributedTask.ServerTask.Remote.Common.WorkItemProgress;
using DistributedTask.ServerTask.Remote.Common.WorkItemProgress.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;

namespace AzureFunctionAdvancedHandler
{
    internal class MyTaskExecutionHandler
    {
        private readonly ServiceBusSettings _serviceBusSettings;
        private readonly TaskProperties _taskProperties;
        private TaskLogger _taskLogger;

        public MyTaskExecutionHandler(TaskProperties taskProperties, ServiceBusSettings serviceBusSettings)
        {
            _taskProperties = taskProperties;
            _serviceBusSettings = serviceBusSettings;
        }

        public async Task<TaskResult> Execute(ILogger log, CancellationToken cancellationToken)
        {
            var taskClient = new TaskClient(_taskProperties);
            var taskResult = TaskResult.Failed;
            try
            {
                // create timeline record if not provided
                _taskLogger = new TaskLogger(_taskProperties, taskClient);
                await _taskLogger.CreateTaskTimelineRecordIfRequired(taskClient, cancellationToken).ConfigureAwait(false);

                // Step #2: Sends a status update to Azure Pipelines that the check started
                await _taskLogger.LogImmediately("Check started!");

                // Step #3: Retrieve Azure Boards ticket referenced in the commit that triggered the pipeline run
                var witClient = new WorkItemClient(_taskProperties);
                var workItem = witClient.GetCommitRelatedWorkItem();

                // Step #4: Check if the ticket is in the `Completed` state
                var isWitCompleted = witClient.IsWorkItemCompleted(workItem);

                // Step #5: Sends a status update with the result of the check
                await _taskLogger.LogImmediately($"Referenced work item #{workItem.Id} is completed: {isWitCompleted}");

                if (!isWitCompleted)
                {
                    // Step #6: Ticket is not in the correct state, reschedule another evaluation in the configured minutes by the application settings
                    var serviceBusClient = new ServiceBusClient(_taskProperties, _serviceBusSettings);
                    var checksEvaluationPeriodInMinutes = Convert.ToInt32(double.Parse(Environment.GetEnvironmentVariable("ChecksEvaluationPeriodInMinutes")));
                    var messageSequenceNumber = serviceBusClient.SendScheduledMessageToQueue(checksEvaluationPeriodInMinutes);

                    // log to azure function's console
                    log.LogInformation($"Message with sequence number {messageSequenceNumber} was successfully sent to the queue!");
                    var checksEvaluationMessage = $"Another evaluation has been rescheduled in {checksEvaluationPeriodInMinutes} minute";
                    checksEvaluationMessage += (checksEvaluationPeriodInMinutes > 1 ? "s" : "") + $" for work item #{workItem.Id}...";
                    // log to ADO check's console
                    await _taskLogger.LogImmediately(checksEvaluationMessage);

                    throw new WorkItemNotCompletedException();
                }
                else
                {
                    // Step #7: Ticket is in the correct state, send a positive decision to Azure Pipelines
                    taskResult = TaskResult.Succeeded;
                    await taskClient.ReportTaskCompleted(_taskProperties.TaskInstanceId, taskResult, cancellationToken).ConfigureAwait(false);
                    await _taskLogger.LogImmediately("Check succeeded!");
                }
            }
            catch (WorkItemNotCompletedException) {}
            catch (Exception e)
            {
                if (_taskLogger != null)
                {
                    if (e is VssServiceException)
                    {
                        await _taskLogger.Log("\n Make sure task's Completion event is set to Callback!").ConfigureAwait(false);
                    }
                    await _taskLogger.Log(e.ToString()).ConfigureAwait(false);
                }

                await taskClient.ReportTaskCompleted(_taskProperties.TaskInstanceId, taskResult, cancellationToken).ConfigureAwait(false);
            }
            finally
            {
                if (_taskLogger != null)
                {
                    await _taskLogger.End().ConfigureAwait(false);
                }

            }
            return taskResult;
        }
    }
}
