using System;
using System.Threading.Tasks;

namespace VstsServerTaskBroker.Azure.ServiceBus
{
    public interface IServiceBusQueueMessageListener
    {
        void Start(Func<IBrokeredMessageWrapper, Task> messageHandlerFunc);

        void Stop();
    }
}