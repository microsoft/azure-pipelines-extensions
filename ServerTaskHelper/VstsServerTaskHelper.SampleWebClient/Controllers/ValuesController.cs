using System.Collections.Generic;
using System.IO;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using VstsServerTaskHelper.Core;
using VstsServerTaskHelper.HttpRequestHandler;

namespace VstsServerTaskHelper.SampleWebClient.Controllers
{
    [Route("api/[controller]")]
    public class ValuesController : Controller
    {
        // GET api/values
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/values/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/values
        [HttpPost]
        public void Post([FromBody]MyObj valuex)
        {
            this.Request.Headers.Add("TaskInstanceName", new StringValues("Sample Http Task"));

            //throw new InvalidDataException(string.Join(", ", this.Request.Headers));
            //var myExecutionHandler = new SampleTaskExecutionHandler();
            //var httpMessageHandler = new HttpRequestHandler.HttpRequestHandler(myExecutionHandler, this.Request.Headers);
            //httpMessageHandler.Execute(CancellationToken.None);

            //var result = requestMessage.Content.ReadAsStringAsync().Result;
            //var content = JsonConvert.DeserializeObject<MyObj>(result);

            //_telemetry.TrackEvent("BlogGateApi2Controller.PostValues() started");
            // launch thread that does the fake work
            //var taskMessage = new TaskMessage(new Dictionary<string, string>
            //{
            //    {"JobId", value.JobId},
            //    {"PlanId", value.PlanId},
            //    {"TimelineId", value.TimelineId},
            //    {"ProjectId", value.ProjectId},
            //    {"AuthToken", value.AuthToken},
            //    {"HubName", value.HubName},
            //    {"PlanUrl", value.VstsUrl},
            //});
            var taskMessage = new TaskMessage(this.Request.Headers.GetTaskPropertiesDictionary());
            var executionHandler = new ExecutionHandler(new SampleTaskExecutionHandler(), taskMessage);
            var executionThread = new Thread(new ThreadStart(executionHandler.Execute));
            //var executionObj = new ExecuteObject(taskMessage.JobId.ToString(), taskMessage.PlanId.ToString(), taskMessage.TimelineId.ToString(), taskMessage.ProjectId.ToString(), this.Request.Headers["PlanUrl"], taskMessage.AuthToken, taskMessage.HubName);
            //var executionObj = new ExecuteObject(value.JobId, value.PlanId, value.TimelineId, value.ProjectId, value.VstsUrl, value.AuthToken, value.HubName);
            //var executionThread = new Thread(new ThreadStart(executionObj.Execute));
            executionThread.Start();
            //_telemetry.TrackEvent("BlogGateApi2Controller.PostValues() started execution thread");

            // return 200 spitting backout what was passed in
            Response.ContentType = "application/json";

            //var json = JsonConvert.SerializeObject(value);

            //_telemetry.TrackEvent("BlogGateApi2Controller.PostValues() returning response");
            //return json;

        }

        // PUT api/values/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
