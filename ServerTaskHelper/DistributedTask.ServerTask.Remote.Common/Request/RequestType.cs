namespace DistributedTask.ServerTask.Remote.Common.Request
{
    // use this in TaskProperties to determine if the request type is Execute or Cancel and call respective api
    public enum RequestType
    {
        Execute,
        Cancel
    }
}