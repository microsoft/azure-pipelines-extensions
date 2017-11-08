using System;

namespace VstsServerTaskBroker
{
    public interface IRetryEventHandler
    {
        void HandleSuccess(int retryCount, long elapsedMilliseconds);

        void HandleRetry(Exception ex, int retryCount, long elapsedMilliseconds);

        void HandleFail(Exception ex, int retryCount, long elapsedMilliseconds);

        bool HandleShouldRetry(Exception ex, int retryCount);
    }
}
