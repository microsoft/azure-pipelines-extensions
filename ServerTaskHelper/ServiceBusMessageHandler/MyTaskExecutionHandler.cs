using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Newtonsoft.Json;
using VstsServerTaskHelper.Core;
using VstsServerTaskHelper.Core.Request;
using VstsServerTaskHelper.Core.TaskProgress;

namespace ServiceBusMessageHandler
{
    public class MyTaskExecutionHandler : ITaskExecutionHandler
    {
        public async Task<TaskResult> ExecuteAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
            // get taskmessage
            // log some values from object
            // return result
            var myObject = JsonConvert.DeserializeObject<MyTaskObject>(taskMessage.GetTaskMessageBody());

            var message = $"Hello {myObject.Name}";
            taskLogger.Log(message);

            return await Task.FromResult(TaskResult.Succeeded);
        }

        public void CancelAsync(TaskMessage taskMessage, TaskLogger taskLogger, CancellationToken cancellationToken)
        {
        }
    }

    public class MyTaskObject
    {
        public string Name { get; set; }
    }
}