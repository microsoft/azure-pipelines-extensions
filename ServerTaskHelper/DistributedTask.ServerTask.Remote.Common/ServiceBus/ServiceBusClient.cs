using System.Text;
using System;
using DistributedTask.ServerTask.Remote.Common.Request;
using Microsoft.Azure.ServiceBus;
using Newtonsoft.Json;
using DistributedTask.ServerTask.Remote.Common.TaskProgress;

namespace DistributedTask.ServerTask.Remote.Common.ServiceBus
{
    public class ServiceBusClient
    {
        private readonly TaskProperties _taskProperties;
        private readonly QueueClient _queueClient;
        public ServiceBusClient(TaskProperties taskProperties, ServiceBusSettings serviceBusSettings)
        {
            _taskProperties = taskProperties;

            _queueClient = new QueueClient(serviceBusSettings.ConnectionString, serviceBusSettings.QueueName);
        }

        public long SendScheduledMessageToQueue(int timeSpanInMinutes)
        {
            var deliveryScheduleTime = DateTime.Now.AddMinutes(timeSpanInMinutes);
            var messageBody = JsonConvert.SerializeObject(_taskProperties);
            var message = new Message(Encoding.UTF8.GetBytes(messageBody));
            return _queueClient.ScheduleMessageAsync(message, deliveryScheduleTime).Result;
        }
    }
}
