using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.TeamFoundation.Common;
using Microsoft.TeamFoundation.Wiki.WebApi;
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
        private readonly BuildHttpClient _buildclient;

        public WorkItemClient(TaskProperties taskProperties)
        {
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            _vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);

            _witClient = _vssConnection
                .GetClient<WorkItemTrackingHttpClient>();

            _taskProperties = taskProperties;
            _buildclient =_vssConnection
                .GetClient<BuildHttpClient>();
        }

        public WorkItem GetWorkItemById()
        {
            if (!_taskProperties.MessageProperties.TryGetValue(CommitIdKey, out var commitId))
            {
                throw new ArgumentException($"{CommitIdKey} header is missing from the check's request headers: \"CommitId\": \"$(Build.SourceVersion)\"");
            }

            if (commitId.IsNullOrEmpty())
            {
                throw new ArgumentException($"{CommitIdKey} header's value is missing. This information is available via continuous integration triggers!");
            }

            if (!_taskProperties.MessageProperties.TryGetValue(BuildIdKey, out var buildIdStr))
            {
                throw new ArgumentException($"{BuildIdKey} header is missing from the check's request headers: \"BuildId\": \"$(Build.BuildId)\"");
            }

            if (!int.TryParse(buildIdStr, out var buildId))
            {
                throw new FormatException($"BuildId ({buildIdStr}) is not valid integer!");
            }

            var projectId = _taskProperties.ProjectId.ToString();

            var commitIds = new List<string>() { commitId };
            var workItemRefs = _buildclient
                .GetBuildWorkItemsRefsFromCommitsAsync(commitIds, projectId, buildId, top: 1)
                .Result;

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

        private const string BuildIdKey = "BuildId";
        private const string CommitIdKey = "CommitId";
    }
}
