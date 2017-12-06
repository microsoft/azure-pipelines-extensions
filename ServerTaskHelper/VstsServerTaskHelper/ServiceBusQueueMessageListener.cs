using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.ServiceBus;

namespace VstsServerTaskHelper
{
    public class ServiceBusQueueMessageListener : IDisposable, IServiceBusQueueMessageListener
    {
        private readonly string connectionString;

        private readonly string queueName;

        private readonly int prefetchCount;

        private readonly int maxConcurrentCalls;

        private QueueClient queueClient;

        private Func<IServiceBusMessage, Task> messageHandler;
        private Func<IServiceBusMessageExceptionHandler, Task> exceptionHandler;

        public ServiceBusQueueMessageListener(string connectionString, string queueName, int prefetchCount, int maxConcurrentCalls)
        {
            this.connectionString = connectionString;
            this.queueName = queueName;
            this.prefetchCount = prefetchCount;
            this.maxConcurrentCalls = maxConcurrentCalls;
        }

        public void Start(Func<IServiceBusMessage, Task> messageHandler, Func<IServiceBusMessageExceptionHandler, Task> exceptionReceivedHandler)
        {
            this.messageHandler = messageHandler;
            this.exceptionHandler = exceptionReceivedHandler;
            this.queueClient = new QueueClient(this.connectionString, this.queueName) { PrefetchCount = this.prefetchCount };
            var messageHandlerOptions = new MessageHandlerOptions(this.ExceptionReceivedHandler)
                                        {
                                            AutoComplete = false,
                                            MaxConcurrentCalls = this.maxConcurrentCalls
                                        };

            this.queueClient.RegisterMessageHandler(this.ReceiveMessage, messageHandlerOptions);
        }

        public void Stop()
        {
            this.Dispose();
        }

        public void Dispose()
        {
            if (this.queueClient != null)
            {
                this.queueClient.CloseAsync();
                this.queueClient = null;
            }
        }

		public Task CompleteAsync(string lockToken)
		{
			return queueClient.CompleteAsync(lockToken);
		}

		public Task DeadLetterAsync(string lockToken)
		{
			return queueClient.DeadLetterAsync(lockToken);
		}

		public Task AbandonAsync(string lockToken)
		{
			return queueClient.AbandonAsync(lockToken);
		}

		private Task ReceiveMessage(Message message, CancellationToken token)
        {
            var wrappedMessage = new ServiceBusMessage(message);
            return this.messageHandler(wrappedMessage);
        }

        private Task ExceptionReceivedHandler(ExceptionReceivedEventArgs exceptionReceivedEventArgs)
        {
            var serviceBusMessageExceptionHandler = new ServiceBusMessageExceptionHandler(exceptionReceivedEventArgs);
            return this.exceptionHandler(serviceBusMessageExceptionHandler);
        }
    }
}