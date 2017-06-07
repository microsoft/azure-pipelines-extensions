using Newtonsoft.Json;

namespace VstsServerTaskBroker
{
    public class SchedulingBrokerSettings
    {
        public int MaxRetryAttempts { get; set; }

        public int AbandonDelayMsecs { get; set; }

        public int MaxAbandonDelayMsecs { get; set; }

        public int LockRefreshDelayMsecs { get; set; }

        public override string ToString()
        {
            return JsonConvert.SerializeObject(this, Formatting.None);
        }
    }
}