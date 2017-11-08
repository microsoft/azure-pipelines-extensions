using System;
using System.Threading.Tasks;

namespace VstsServerTaskBroker
{
    public interface IRetryEventHandler
    {
        void Success(int retryCount, long elapsedMilliseconds);

        void Retry(Exception ex, int retryCount, long elapsedMilliseconds);

        void Fail(Exception ex, int retryCount, long elapsedMilliseconds);
    }
}
