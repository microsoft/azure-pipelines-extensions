using VstsServerTaskHelper.Core.Contracts;

namespace VstsServerTaskHelper.Core
{
    public class TaskMessage : ITaskMessage
    {
        private readonly string taskMessageBody;
        private readonly TaskProperties taskProperties;

        public TaskMessage(string taskMessageBody, TaskProperties taskProperties)
        {
            this.taskMessageBody = taskMessageBody;
            this.taskProperties = taskProperties;
        }

        public string GetTaskMessageBody()
        {
            return taskMessageBody;
        }

        public TaskProperties GetTaskProperties()
        {
            return taskProperties;
        }
    }
}