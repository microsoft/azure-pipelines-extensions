using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.WebApi;

namespace AzureFunctionAdvancedSample.VstsHandlers
{


    public class TimelineHandler
    {
        private BuildHttpClient buildClient;
        private VssConnection vssConnection;

        public TimelineHandler(TaskProperties taskProperties)
        {
            var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);

            //var buildClient = connection
            //    .GetClient<BuildHttpClient>();

            //this.taskProperties = taskProperties;
            //var vssBasicCredential = new VssBasicCredential(string.Empty, taskProperties.AuthToken);
            //vssConnection = new VssConnection(taskProperties.PlanUri, vssBasicCredential);
            //taskClient = vssConnection.GetClient<TaskHttpClient>();
        }
    }

    ///// <summary>
    ///// Step #3: Retrieve pipeline run's Timeline entry
    ///// </summary>
    ///// <param name="httpClient"></param>
    ///// <param name="planUrl"></param>
    ///// <param name="projectId"></param>
    ///// <param name="buildId"></param>
    ///// <param name="authToken"></param>
    ///// <returns></returns>
    //public static Timeline GetTimelineEntry(HttpClient httpClient, string planUrl, string projectId, int buildId, StringValues authToken)
    //{
    //    var connection = new VssConnection(new Uri(planUrl), new VssBasicCredential(string.Empty, authToken));

    //    var buildClient = connection
    //        .GetClient<BuildHttpClient>();

    //    return buildClient
    //        .GetBuildTimelineAsync(projectId, buildId)
    //        .Result;
    //}

    ///// <summary>
    ///// Step #4: Check if the Timeline contains a CmdLine task
    ///// </summary>
    ///// <param name="timeline"></param>
    ///// <returns></returns>
    //public static bool IsCmdLineTaskPresent(Timeline timeline)
    //{
    //    var cmdLineTaskId = new Guid("D9BAFED4-0B18-4F58-968D-86655B4D2CE9");

    //    var cmdLineTasks = timeline
    //        .Records
    //        .FindAll(record => (record.RecordType == "Task") && (record.Task != null) && (StringComparer.OrdinalIgnoreCase.Equals(record.Task.Id, cmdLineTaskId)));
    //    if (cmdLineTasks?.Count > 0)
    //    {
    //        return true;
    //    }
    //    return false;
    //}

}
