using System;
using System.Runtime.Serialization;

namespace VstsServerTaskBroker
{
    [Serializable]
    public class VstsArtifactsNotFoundException : Exception
    {
        public VstsArtifactsNotFoundException()
        {
        }

        public VstsArtifactsNotFoundException(string message)
            : base(message)
        {
        }

        public VstsArtifactsNotFoundException(string message, Exception inner)
            : base(message, inner)
        {
        }

        protected VstsArtifactsNotFoundException(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
        }
    }
}