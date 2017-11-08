using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VstsServerTaskBroker.Azure.ServiceBus
{
    /// <summary>
    /// This interface is for a wrapper around the Azure brokered message.
    /// </summary>
    public interface IBrokeredMessageWrapper
    {
        DateTime LockedUntilUtc { get; }

        T GetBody<T>();

        string GetMessageId();

        object GetProperty(string key);

        void SetProperty(string key, object value);
    }
}
