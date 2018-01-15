using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Newtonsoft.Json;
using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.SampleServiceBusMessageHandlerApp
{
    public class ClientScheduleHandler : ITaskExecutionHandler
    {
        private readonly ILogger logger;

        public ClientScheduleHandler(ILogger logger)
        {
            this.logger = logger;
        }

        public async Task<ITaskExecutionHandlerResult> ExecuteAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            // get taskmessage
            // log some values from object
            // return result
            var sampleObject = JsonConvert.DeserializeObject<SampleObject>(taskMessage.GetTaskMessageBody());

            var message = $"Hello {sampleObject.Name}";
            taskLogger.Log(message);
            await this.logger.LogInfo("Execute", message, new Dictionary<string, string>(), cancellationToken).ConfigureAwait(false);

            var result = new TaskExecutionHandlerResult {Result = TaskResult.Succeeded};
            return await Task.FromResult(result);
        }

        public void CancelAsync(ITaskMessage taskMessage, ITaskLogger taskLogger, CancellationToken cancellationToken)
        {
            //var testSessionId = vstsMessage.JobId;

            //return await Task.FromResult<string>(string.Format("Test session {0} Cancelled", testSessionId));
        }
    }

    public class SampleObject
    {
        public string Name { get; set; }
    }
}