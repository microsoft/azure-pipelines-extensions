using System;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace AzureFunctionBasicHandler.AdoClients
{
    public class BuildClient
    {
        private readonly BuildHttpClient _buildClient;
        private readonly VssConnection _vssConnection;
        private readonly TaskProperties _taskProperties;

        public BuildClient(TaskProperties taskProperties)
        {
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            _vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);

            _buildClient = _vssConnection
                .GetClient<BuildHttpClient>();

            _taskProperties = taskProperties;
        }

        /// <summary>
        /// Step #3: Retrieve pipeline run's Timeline entry
        /// </summary>
        /// <returns></returns>
        public Timeline GetTimelineByBuildId()
        {
            if (!_taskProperties.MessageProperties.TryGetValue(BuildIdKey, out var buildIdStr))
            {
                throw new ArgumentException($"{BuildIdKey} header is missing from the check's request headers: \"BuildId\": \"$(Build.BuildId)\"");
            }

            if (!int.TryParse(buildIdStr, out var buildId))
            {
                throw new FormatException($"BuildId ({buildIdStr}) is not valid integer!");
            }

            var projectId = _taskProperties.ProjectId.ToString();

            return _buildClient
                .GetBuildTimelineAsync(projectId, buildId)
                .Result;
        }

        /// <summary>
        /// Step #4: Check if the Timeline contains a CmdLine task
        /// </summary>
        /// <param name="timeline"></param>
        /// <returns></returns>
        public static bool IsCmdLineTaskPresent(Timeline timeline)
        {
            var cmdLineTaskGuid = new Guid(CmdLineTaskId);

            var cmdLineTasks = timeline
                .Records
                .FindAll(record => (record.RecordType == "Task") && (record.Task != null) && (StringComparer.OrdinalIgnoreCase.Equals(record.Task.Id, cmdLineTaskGuid)));

            if (cmdLineTasks?.Count > 0)
            {
                return true;
            }

            return false;
        }

        private const string BuildIdKey = "BuildId";
        private const string CmdLineTaskId = "D9BAFED4-0B18-4F58-968D-86655B4D2CE9";
    }
}
