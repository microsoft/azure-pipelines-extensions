using System.Net.Http;
using System.Threading;
using Microsoft.ApplicationInsights;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace VstsServerTaskHelper.SampleWebClient.Controllers
{
    public class BlogGateApi2Controller : Controller
    {
        private TelemetryClient _telemetry = new TelemetryClient();

        // GET: BlogGateApi2
        [HttpPost]
        public object Post([FromBody]HttpRequestMessage requestMessage)
        {
            var result = requestMessage.Content.ReadAsStringAsync().Result;
            var content = JsonConvert.DeserializeObject<MyObj>(result);
        
            _telemetry.TrackEvent("BlogGateApi2Controller.PostValues() started");
            // launch thread that does the fake work
            var executionObj = new ExecuteObject(content.JobId, content.PlanId, content.TimelineId, content.ProjectId, content.VstsUrl, content.AuthToken, content.HubName);
            var executionThread = new Thread(new ThreadStart(executionObj.Execute));
            executionThread.Start();
            _telemetry.TrackEvent("BlogGateApi2Controller.PostValues() started execution thread");

            // return 200 spitting backout what was passed in
            Response.ContentType = "application/json";

            var json = JsonConvert.SerializeObject(content);

            _telemetry.TrackEvent("BlogGateApi2Controller.PostValues() returning response");
            return json;
        }
    }

    public class MyObj
    {
        public string JobId { get; set; }
        public string PlanId { get; set; }
        public string TimelineId { get; set; }
        public string ProjectId { get; set; }
        public string VstsUrl { get; set; }
        public string AuthToken { get; set; }
        public string One { get; set; }
        public string Two { get; set; }
        public string HubName { get; set; }
    }
}