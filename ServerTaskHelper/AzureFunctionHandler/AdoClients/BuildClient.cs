using System;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace AzureFunctionAdvancedSample.VstsHandlers
{
    public class BuildClient
    {
        private readonly BuildHttpClient buildClient;
        private readonly VssConnection vssConnection;
        private readonly TaskProperties taskProperties;

        public BuildClient(TaskProperties taskProperties)
        {
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);

            this.buildClient = vssConnection
                .GetClient<BuildHttpClient>();

            this.taskProperties = taskProperties;
        }

        /// <summary>
        /// Step #3: Retrieve pipeline run's Timeline entry
        /// </summary>
        /// <param name="httpClient"></param>
        /// <param name="planUrl"></param>
        /// <param name="projectId"></param>
        /// <param name="buildId"></param>
        /// <param name="authToken"></param>
        /// <returns></returns>
        public Timeline GetTimelineByBuildId()
        {
            //var runningBuilds = buildClient.GetBuildsAsync(project: taskProperties.ProjectId, statusFilter: BuildStatus.InProgress).Result;

            if (taskProperties.MessageProperties.TryGetValue(BuildIdKey, out var buildIdStr))
            {
                if (Int32.TryParse(buildIdStr, out var buildId))
                {
                    return this.buildClient
                    .GetBuildTimelineAsync(taskProperties.ProjectId.ToString(), buildId)
                    .Result;
                }

                throw new FormatException($"BuildId ({buildIdStr}) is not valid integer!");
            }

            var message = "BuildId is missing from the request headers!\n"
                + "It should be added in the Headers section of Invoke Azure Function check as: \"BuildId\": \"$(Build.BuildId)\"";

            throw new ArgumentNullException(message);
        }

        /// <summary>
        /// Step #4: Check if the Timeline contains a CmdLine task
        /// </summary>
        /// <param name="timeline"></param>
        /// <returns></returns>
        public static bool IsCmdLineTaskPresent(Timeline timeline)
        {
            var cmdLineTaskId = new Guid("D9BAFED4-0B18-4F58-968D-86655B4D2CE9");

            var cmdLineTasks = timeline
                .Records
                .FindAll(record => (record.RecordType == "Task") && (record.Task != null) && (StringComparer.OrdinalIgnoreCase.Equals(record.Task.Id, cmdLineTaskId)));
            if (cmdLineTasks?.Count > 0)
            {
                return true;
            }
            return false;
        }

        private const string BuildIdKey = "BuildId";
    }
}
