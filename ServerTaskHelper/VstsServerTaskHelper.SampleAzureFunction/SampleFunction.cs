using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;

namespace VstsServerTaskHelper.SampleAzureFunction
{
    public static class SampleFunction
    {
        [FunctionName("SampleFunction")]
        public static async Task<HttpResponseMessage> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)]HttpRequestMessage req, TraceWriter log)
        {
            log.Info("C# HTTP trigger function processed a request.");

            // Get request body
            var myObject = await req.Content.ReadAsAsync<MyObject>();
            var messageBody = await req.Content.ReadAsStringAsync().ConfigureAwait(false);
            var myExecutionHandler = new SampleTaskExecutionHandler();
            req.Headers.Add("TaskInstanceName", "Sample Azure Function");
            var httpMessageHandler = new AzureFunctionRequestHandler.AzureFunctionRequestHandler(myExecutionHandler, messageBody, req.Headers);
            httpMessageHandler.Execute(CancellationToken.None);

            return req.CreateResponse(HttpStatusCode.OK, $"Hello {myObject.Name}");
        }
    }

    public class MyObject
    {
        public string Name { get; set; }
    }
}
