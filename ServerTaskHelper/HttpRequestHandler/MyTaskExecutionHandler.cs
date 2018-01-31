using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common;
using DistributedTask.ServerTask.Remote.Common.Request;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;
using Microsoft.TeamFoundation.DistributedTask.WebApi;
using Newtonsoft.Json;

namespace HttpRequestHandler
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
            await taskLogger.Log(message).ConfigureAwait(false);

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
