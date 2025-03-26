namespace DistributedTask.ServerTask.Remote.Common.ServiceBus
{
    public class ServiceBusSettings
    {
        public ServiceBusSettings(string connectionString, string queueName)
        {
            ConnectionString = connectionString;
            QueueName = queueName;
        }
        public string ConnectionString { get; set; }
        public string QueueName { get; set; }
    }
}