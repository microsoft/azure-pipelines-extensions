using System;
using System.Threading;
using System.Threading.Tasks;

namespace VstsServerTaskHelper.UnitTests
{
    internal class MockVstsHandler : IVstsScheduleHandler<TestVstsMessage>
    {
        public Func<TestVstsMessage, Task<VstsScheduleResult>> MockExecuteFunc { get; set; }

        public Func<TestVstsMessage, Task<string>> MockCancelFunc { get; set; }

        public Task<VstsScheduleResult> Execute(TestVstsMessage vstsMessage, CancellationToken cancellationToken)
        {
            if (this.MockExecuteFunc != null)
            {
                return this.MockExecuteFunc(vstsMessage);
            }

            throw new NotImplementedException();
        }

        public Task<string> Cancel(TestVstsMessage vstsMessage, CancellationToken cancellationToken)
        {
            if (this.MockCancelFunc != null)
            {
                return this.MockCancelFunc(vstsMessage);
            }

            throw new NotImplementedException();
        }
    }
}