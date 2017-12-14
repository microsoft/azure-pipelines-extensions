using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper
{
    public interface IVstsMessageHandler<T> where T: VstsMessage
    {
        Task RecieveMessageAsync(T vstsMessage, CancellationToken cancellationToken);
    }
}