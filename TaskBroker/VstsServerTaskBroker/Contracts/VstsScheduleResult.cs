namespace VstsServerTaskHelper
{
    public class VstsScheduleResult
    {
        public bool ScheduleFailed { get; set; }

        public string Message { get; set; }

        public string ScheduledId { get; set; }
    }
}