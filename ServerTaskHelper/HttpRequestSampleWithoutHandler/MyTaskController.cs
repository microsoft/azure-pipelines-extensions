using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using HttpRequestSampleWithoutHandler;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HttpRequestHandler
{
    [Route("api/[controller]")]
    public class MyTaskController : Controller
    {
        // GET api/MyTask
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "This is the sample task", "Use the post method in your release task to see this example work end-to-end." };
        }

        // POST api/MyTask
        [HttpPost]
        public void Execute()
        {
            // Read task body
            string taskMessageBody;
            using (var receiveStream = this.Request.Body)
            {
                using (var sr = new StreamReader(receiveStream, Encoding.UTF8))
                {
                    taskMessageBody = sr.ReadToEnd();
                }
            }

            string projectId = this.Request.Headers["ProjectId"];
            string planId = this.Request.Headers["PlanId"];
            string jobId = this.Request.Headers["JobId"];
            string timelineId = this.Request.Headers["TimelineId"];
            string taskInstanceId = this.Request.Headers["TaskInstanceId"];
            string hubName = this.Request.Headers["HubName"];
            string taskInstanceName = this.Request.Headers["TaskInstanceName"];
            string planUrl = this.Request.Headers["PlanUrl"];
            string authToken = this.Request.Headers["AuthToken"];

            // Ensure projectId, planId, jobId, timelineId, taskInstanceId are proper guids.
            
            // Handover time consuming work to another task. Completion event should be set to "Callback" in pipeline task.
            Task.Run(() => MyApp.ExecuteAsync(taskMessageBody, projectId, planUrl, hubName, planId, jobId, timelineId, taskInstanceId, taskInstanceName, authToken));
        }
    }
}
