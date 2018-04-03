using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using DistributedTask.ServerTask.Remote.Common;
using Microsoft.Azure.ServiceBus;

namespace ServiceBusMessageHandler.ServiceBus
{
    public class ServiceBusMessageListener
    {
        private readonly ITaskExecutionHandler taskExecutionHandler;
        private readonly ServiceBusSettings serviceBusSettings;
        private QueueClient queueClient;

        public ServiceBusMessageListener(ServiceBusSettings serviceBusSettings, ITaskExecutionHandler taskExecutionHandler)
        {
            this.serviceBusSettings = serviceBusSettings;
            this.taskExecutionHandler = taskExecutionHandler;
        }

        public async Task ReceiveAsync(ServiceBusMessage message, CancellationToken cancellationToken)
        {
            try
            {
                var executionHandler = new ExecutionHandler(taskExecutionHandler, message.GetBody(), message.GetMyProperties());
                await executionHandler.Execute(cancellationToken).ConfigureAwait(false);

                await this.queueClient.CompleteAsync(message.GetLockToken()).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                Trace.TraceError("{0}", ex);

                // You can add code to abandon the service bus message or put the message in dead letter queue
            }
        }

        public void Start()
        {
            this.queueClient = new QueueClient(this.serviceBusSettings.ConnectionString, this.serviceBusSettings.QueueName);
            Task ReceivedHandler(ExceptionReceivedEventArgs args) => Task.CompletedTask;
            var messageHandlerOptions = new MessageHandlerOptions(ReceivedHandler)
            {
                AutoComplete = false,
            };

            this.queueClient.RegisterMessageHandler(this.ReceiveMessage, messageHandlerOptions);
        }

        public void Stop()
        {
            if (this.queueClient != null)
            {
                this.queueClient.CloseAsync().ConfigureAwait(false).GetAwaiter().GetResult();
                this.queueClient = null;
            }

//            return queueClient.CompleteAsync(lockToken);

        }

        private Task ReceiveMessage(Message message, CancellationToken token)
        {
            var wrappedMessage = new ServiceBusMessage(message);
            return this.ReceiveAsync(wrappedMessage, token);
        }


    }
}
