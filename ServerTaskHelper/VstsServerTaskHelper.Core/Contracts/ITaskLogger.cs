namespace VstsServerTaskHelper.Core.Contracts
{
    public interface ITaskLogger
    {
        void Log(string message);
        void End();
    }
}