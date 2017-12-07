using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.SampleClient
{
    public class VstsRequestListener<T>
        where T : VstsMessage
    {
        private readonly ILogger logger;
        private readonly IServiceBusQueueMessageListener serviceBusQueueMessageListener;
        private readonly ServiceBusQueueMessageHandler<T> serviceBusQueueMessageHandler;

        public VstsRequestListener(ServiceBusQueueMessageHandler<T> serviceBusQueueMessageHandler, IServiceBusQueueMessageListener serviceBusQueueMessageListener, ILogger logger)
        {
            this.logger = logger;
            this.serviceBusQueueMessageListener = serviceBusQueueMessageListener;
            this.serviceBusQueueMessageHandler = serviceBusQueueMessageHandler;
        }

        // Use this Handler to look at the exceptions received on the MessagePump
        private async Task ExceptionReceivedHandler(IServiceBusMessageExceptionHandler serviceBusMessageExceptionHandler, CancellationToken cancellationToken)
        {
            const string exceptionMessage = "Message handler encountered an exception";

            var eventProperties = new Dictionary<string, string>
            {
                {"Endpoint", serviceBusMessageExceptionHandler.Endpoint},
                {"Entity Path", serviceBusMessageExceptionHandler.EntityPath},
                {"Executing Action", serviceBusMessageExceptionHandler.Action}
            };

            await this.logger.LogException(serviceBusMessageExceptionHandler.Exception, "MessageProcessingException", exceptionMessage, eventProperties, cancellationToken).ConfigureAwait(false);
        }

        public void Start(CancellationToken cancellationToken)
        {
            this.serviceBusQueueMessageListener.Start(
                (message) => this.serviceBusQueueMessageHandler.ReceiveAsync(message, cancellationToken),
                (exception) => this.ExceptionReceivedHandler(exception, cancellationToken));
        }

        public void Stop()
        {
            this.serviceBusQueueMessageListener.Stop();
        }

        public void Dispose()
        {
            this.Stop();
        }
    }
}
