using System;
using System.Linq;
using DistributedTask.ServerTask.Remote.Common.Build;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.TeamFoundation.Common;
using Microsoft.TeamFoundation.WorkItemTracking.WebApi;
using Microsoft.TeamFoundation.WorkItemTracking.WebApi.Models;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace DistributedTask.ServerTask.Remote.Common.WorkItemProgress
{
    public class WorkItemClient
    {
        private readonly VssConnection _vssConnection;
        private readonly TaskProperties _taskProperties;
        private readonly WorkItemTrackingHttpClient _witClient;
        private readonly BuildClient _buildclient;

        public WorkItemClient(TaskProperties taskProperties, BuildClient buildClient = null)
        {
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            _vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);

            _witClient = _vssConnection
                .GetClient<WorkItemTrackingHttpClient>();

            _taskProperties = taskProperties;

            if (buildClient is null)
            {
                _buildclient = new BuildClient(_taskProperties);
            }
            else
            {
                _buildclient = buildClient;
            }
        }

        public WorkItem GetCommitRelatedWorkItem()
        {
            if (!_taskProperties.MessageProperties.TryGetValue(CommitIdKey, out var commitId))
            {
                throw new ArgumentException($"{CommitIdKey} header is missing from the check's request headers: \"CommitId\": \"$(Build.SourceVersion)\"");
            }

            if (commitId.IsNullOrEmpty())
            {
                throw new ArgumentException($"{CommitIdKey} header's value is missing. This information is available via continuous integration triggers!");
            }

            var workItemRefs = _buildclient.GetWorkItemsFromCommit(commitId);

            if (workItemRefs?.Count == 0)
            {
                throw new ArgumentException($"There are no work items linked to commit {commitId}.");
            }

            var workItemId = int.Parse(workItemRefs.First().Id);

            var workItem = _witClient
                .GetWorkItemAsync(project: _taskProperties.ProjectId.ToString(), id: workItemId)
                .Result;

            return workItem;
        }

        public bool IsWorkItemCompleted(WorkItem wit)
        {
            var witType = wit.Fields["System.WorkItemType"].ToString();
            var witStateColors = _witClient
                .GetWorkItemTypeStatesAsync(project: _taskProperties.ProjectId, type: witType)
                .Result;

            var witState = wit.Fields["System.State"].ToString();
            var witStateCategory = witStateColors
                        .Where(state => state.Name.Equals(witState))
                        .Select(state => state.Category)
                        .First();

            if (witStateCategory.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        private const string CommitIdKey = "CommitId";
    }
}
