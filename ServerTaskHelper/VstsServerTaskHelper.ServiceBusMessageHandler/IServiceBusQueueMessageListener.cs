using System;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.ServiceBusMessageHandler
{
    public interface IServiceBusQueueMessageListener
    {
        void Start(Func<IServiceBusMessage, Task> messageHandler, Func<IServiceBusMessageExceptionHandler, Task> exceptionReceivedHandler);

        void Stop();

		Task CompleteAsync(string lockToken);
		
		Task AbandonAsync(string lockToken);

		Task DeadLetterAsync(string lockToken);
	}
}