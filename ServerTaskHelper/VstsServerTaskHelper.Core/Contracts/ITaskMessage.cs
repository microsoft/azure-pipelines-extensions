namespace VstsServerTaskHelper.Core.Contracts
{
    public interface ITaskMessage
    {
        string GetTaskMessageBody();

        TaskProperties GetTaskProperties();
    }
}
