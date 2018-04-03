using System;
using Microsoft.Extensions.Configuration;
using ServiceBusMessageHandler.ServiceBus;

namespace ServiceBusMessageHandler
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
            };

            var myHandler = new MyTaskExecutionHandler();
            var listener = new ServiceBusMessageListener(serviceBusSettings, myHandler);

            Console.WriteLine(
                "Starting the VSTS request listener on queue '{0}'", serviceBusSettings.QueueName);

            listener.Start();

            Console.WriteLine("Press any key to exit after receiving all the messages ...");

            Console.ReadKey();

            listener.Stop();
            Console.WriteLine("Shutting down VSTS request listener ...");
        }
    }
}
