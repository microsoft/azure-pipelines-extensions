namespace VstsServerTaskHelper
{
    public class ServiceBusSettings
    {
        public string ConnectionString { get; set; }
        public string QueueName { get; set; }
        public int PrefetchCount { get; set; }
        public int MaxConcurrentCalls { get; set; }
    }
}