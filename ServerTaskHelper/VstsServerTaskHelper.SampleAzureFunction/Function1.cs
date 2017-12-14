using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;

namespace VstsServerTaskHelper.SampleAzureFunction
{
    public static class Function1
    {
        [FunctionName("Function1")]
        public static async Task<TestClass> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)]TestClass req, TraceWriter log)
        {
            log.Info("C# HTTP trigger function processed a request.");

            // parse query parameter
            //string name = req.GetQueryNameValuePairs()
            //    .FirstOrDefault(q => string.Compare(q.Key, "name", true) == 0)
            //    .Value;

            //// Get request body
            //dynamic data = await req.Content.ReadAsAsync<object>();

            //// Set name to query string or body data
            //name = name ?? data?.name;

            //return name == null
            //    ? req.CreateResponse(HttpStatusCode.BadRequest, "Please pass a name on the query string or in the request body")
            //    : req.CreateResponse(HttpStatusCode.OK, "Hello " + name);

            return new TestClass() {TestName = req.TestName};
        }

        public class TestClass
        {
            public string TestName { get; set; }
        }
    }
}
