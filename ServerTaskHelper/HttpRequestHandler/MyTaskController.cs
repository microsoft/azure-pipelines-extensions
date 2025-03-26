﻿using System.Text;
using DistributedTask.ServerTask.Remote.Common;
using DistributedTask.ServerTask.Remote.Common.Request;
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

            // Since we expect all the VSTS properties to be in the request headers, fetch them from the headers
            //
            var taskProperties = GetTaskProperties(this.Request.Headers);

            // Create my own task execution handler. You should replace it with your task execution handler.
            ITaskExecutionHandler myTaskExecutionHandler = new MyTaskExecutionHandler();

            var executionHandler = new ExecutionHandler(myTaskExecutionHandler, taskMessageBody, taskProperties);
            var executionThread = new Thread(() => executionHandler.Execute(CancellationToken.None));
            executionThread.Start();
        }

        private static TaskProperties GetTaskProperties(IHeaderDictionary headerDictionary)
        {
            var taskPropertiesDictionary = TaskProperties.PropertiesList.Where(headerDictionary.ContainsKey)
                .ToDictionary<string, string, string>(expectedTaskProperty => expectedTaskProperty,
                    expectedTaskProperty => headerDictionary[expectedTaskProperty]);

            return new TaskProperties(taskPropertiesDictionary);
        }

    }
}
