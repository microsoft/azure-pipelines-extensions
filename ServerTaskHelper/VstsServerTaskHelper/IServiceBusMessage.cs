using System;

namespace VstsServerTaskHelper
{
    /// <summary>
    /// This interface is for a wrapper around the Azure brokered message.
    /// </summary>
    public interface IServiceBusMessage
    {
        DateTime LockedUntilUtc { get; }

        string GetBody();

        string GetMessageId();

        string GetLockToken();

        object GetProperty(string key);

        void SetProperty(string key, object value);
    }
}
