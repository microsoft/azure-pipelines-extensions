using System;
using System.Threading;
using Microsoft.Extensions.Configuration;
using VstsServerTaskHelper.ServiceBusMessageHandler;

namespace VstsServerTaskHelper.SampleServiceBusMessageHandlerApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var configBuilder = new ConfigurationBuilder();
            var config = configBuilder.AddJsonFile("appsettings.json").Build();

            var serviceBusSettings = new ServiceBusSettings
            {
                ConnectionString = config.GetSection("ServiceBus:ConnectionString").Value,
                QueueName = config.GetSection("ServiceBus:QueueName").Value,
                PrefetchCount = int.Parse(config.GetSection("Vsts:QueuePrefetchCount").Value),
                MaxConcurrentCalls = int.Parse(config.GetSection("Vsts:QueueMaxConcurrentCalls").Value)
            };

            var serviceBusQueueMessageHandlerSettings = new ServiceBusQueueMessageHandlerSettings
            {
                MaxRetryAttempts = int.Parse(config.GetSection("Vsts:MaxRetryAttempts").Value),
                AbandonDelayMsecs = int.Parse(config.GetSection("Vsts:AbandonDelayMsecs").Value),
                MaxAbandonDelayMsecs = int.Parse(config.GetSection("Vsts:MaxAbandonDelayMsecs").Value),
                LockRefreshDelayMsecs = int.Parse(config.GetSection("Vsts:LockRefreshDelayMsecs").Value),
                TimeLineNamePrefix = "Test",
                WorkerName = "MicroService"
            };

            var cancellationTokenSource = new CancellationTokenSource();

            var sampleLogger = new SampleLogger();
            var clientScheduleHandler = new ClientScheduleHandler(sampleLogger);
            var serviceBusQueueMessageListener = new ServiceBusQueueMessageListener(serviceBusSettings);
            var serviceBusQueueMessageHandler = new ServiceBusQueueMessageHandler(serviceBusQueueMessageListener, clientScheduleHandler, serviceBusQueueMessageHandlerSettings);

            var clientListener = new VstsRequestListener(serviceBusQueueMessageHandler, serviceBusQueueMessageListener, sampleLogger);
            Console.WriteLine(
                "Starting the VSTS request listener on queue '{0}' with prefetch count '{1}', max concurrent calls '{2}' and message handler settings [{3}]",
                serviceBusSettings.QueueName, 
                serviceBusSettings.PrefetchCount, 
                serviceBusSettings.MaxConcurrentCalls,
                serviceBusQueueMessageHandlerSettings);
            Console.WriteLine("Press any key to exit after receiving all the messages ...");
            clientListener.Start(cancellationTokenSource.Token);
            
            Console.ReadKey();

            Console.WriteLine("Shutting down VSTS request listener ...");
        }
    }
}
