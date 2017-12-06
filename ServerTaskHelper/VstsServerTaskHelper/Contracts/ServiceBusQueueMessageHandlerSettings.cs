using Newtonsoft.Json;

namespace VstsServerTaskHelper
{
    public class ServiceBusQueueMessageHandlerSettings
    {
        public int MaxRetryAttempts { get; set; }

        public int AbandonDelayMsecs { get; set; }

        public int MaxAbandonDelayMsecs { get; set; }

        public int LockRefreshDelayMsecs { get; set; }

        public string TimeLineNamePrefix { get; set; }

        public string WorkerName { get; set; }

        public override string ToString()
        {
            return JsonConvert.SerializeObject(this, Formatting.None);
        }
    }
}