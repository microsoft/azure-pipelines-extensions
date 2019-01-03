namespace AzureFunctionSample
{
    internal class MyAppParameters
    {
        public string TenantId { get; set; }
        public string AzureSubscriptionClientId { get; set; }
        public string AzureSubscriptionClientSecret { get; set; }
        public string ResourceGroupName { get; set; }
        public string PipelineAccountName { get; set; }
        public string AgentName { get; set; }
        public string AgentPoolName { get; set; }
        public string PATToken { get; set; }
    }
}