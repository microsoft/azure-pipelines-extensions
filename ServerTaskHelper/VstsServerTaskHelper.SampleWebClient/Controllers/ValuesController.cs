using System.Collections.Generic;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

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
        public void Post([FromBody]MyObject value)
        {
            this.Request.Headers.Add("TaskInstanceName", new StringValues("Sample Http Task"));

            var myExecutionHandler = new SampleTaskExecutionHandler();
            var httpMessageHandler = new HttpRequestHandler.HttpRequestHandler(myExecutionHandler, this.Request.Headers);
            httpMessageHandler.Execute(CancellationToken.None);
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
