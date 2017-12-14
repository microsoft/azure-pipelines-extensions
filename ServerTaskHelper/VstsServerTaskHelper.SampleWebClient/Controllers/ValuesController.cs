using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.Services.WebApi;
using VstsServerTaskHelper.SampleClient;

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
        public void Post([FromBody]VstsMessage value)
        {
            var sampleLogger = new SampleLogger();
            var clientScheduleHandler = new ClientScheduleHandler(sampleLogger);
            var httpMessageHandler = new HttpMessageHandler<VstsMessage>(clientScheduleHandler, sampleLogger);
            httpMessageHandler.RecieveMessageAsync(value, CancellationToken.None);
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
