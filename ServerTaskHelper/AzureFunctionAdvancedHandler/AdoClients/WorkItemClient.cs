using System;
using System.Linq;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.TeamFoundation.WorkItemTracking.WebApi;
using Microsoft.TeamFoundation.WorkItemTracking.WebApi.Models;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace AzureFunctionAdvancedHandler.AdoClients
{
    public class WorkItemClient
    {
        private readonly VssConnection vssConnection;
        private readonly TaskProperties taskProperties;
        private readonly WorkItemTrackingHttpClient witClient;

        public WorkItemClient(TaskProperties taskProperties)
        {
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);

            this.witClient = vssConnection
                .GetClient<WorkItemTrackingHttpClient>();

            this.taskProperties = taskProperties;
        }

        public WorkItem GetWorkItemById()
        {
            WorkItem wit = null;
            if (taskProperties.MessageProperties.TryGetValue("WitId", out var witIdStr))
            {
                if (Int32.TryParse(witIdStr, out var witId))
                {
                    wit = witClient
                        .GetWorkItemAsync(project: taskProperties.ProjectId.ToString(), id: witId)
                        .Result;
                }

            }
            return wit;
        }

        public bool IsWorkItemCompleted(WorkItem wit)
        {
            var witType = wit.Fields["System.WorkItemType"].ToString();
            var witStateColors = witClient
                .GetWorkItemTypeStatesAsync(project: taskProperties.ProjectId, type: witType)
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
    }
}
