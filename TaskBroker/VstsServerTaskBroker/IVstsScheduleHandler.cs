using System.Threading;
using System.Threading.Tasks;



namespace VstsServerTaskHelper
{
    public interface IVstsScheduleHandler<T> 
        where T : VstsMessageBase
    {
        Task<VstsScheduleResult> Execute(T vstsMessage, CancellationToken cancellationToken);

        Task<string> Cancel(T vstsMessage, CancellationToken cancellationToken);
    }

    public class VstsScheduleResult
    {
        public bool ScheduleFailed { get; set; }

        public string Message { get; set; }

        public string ScheduledId { get; set; }
    }
}