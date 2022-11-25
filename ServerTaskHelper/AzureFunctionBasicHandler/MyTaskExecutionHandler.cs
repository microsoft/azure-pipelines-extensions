using System;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common.Build;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.Extensions.Logging;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Microsoft.VisualStudio.Services.Common;

namespace AzureFunctionBasicHandler
{
    public class MyTaskExecutionHandler
    {

        private readonly TaskProperties _taskProperties;
        private TaskLogger _taskLogger;

        public MyTaskExecutionHandler(TaskProperties taskProperties)
        {
            _taskProperties = taskProperties;
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

                // Step #2: Send a status update to Azure Pipelines that the check started
                await _taskLogger.LogImmediately("Check started!");

                // Step #3: Retrieve pipeline run's Timeline entry
                var buildClient = new BuildClient(_taskProperties);
                var timeline = buildClient.GetTimelineByBuildId();

                // Step #4: Check if the Timeline contains a CmdLine task
                var isCmdLineTaskPresent = BuildClient.IsCmdLineTaskPresent(timeline);

                // Step #5: Send a status update with the result of the search
                await _taskLogger.LogImmediately($"CmdLine task is present: {isCmdLineTaskPresent}");
                taskResult = isCmdLineTaskPresent ? TaskResult.Succeeded : TaskResult.Failed;
                return await Task.FromResult(taskResult);
            }
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
            }
            finally
            {
                if (_taskLogger != null)
                {
                    await _taskLogger.End().ConfigureAwait(false);
                }

                // Step #6: Send a check decision to Azure Pipelines
                await taskClient.ReportTaskCompleted(_taskProperties.TaskInstanceId, taskResult, cancellationToken).ConfigureAwait(false);
            }
            return taskResult;
        }
    }
}
