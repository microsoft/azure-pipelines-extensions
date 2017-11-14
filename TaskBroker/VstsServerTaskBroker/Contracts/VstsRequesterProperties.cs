using System;

namespace VstsServerTaskHelper
{
    public class VstsRequesterProperties
    {
        /// <summary>
        /// Gets or sets the requester email for scheduled builds
        /// </summary>
        public string ScheduleBuildRequesterAlias { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build requester email id.
        /// </summary>
        public string RequesterEmail { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build requestor name [FirstName LastName].
        /// </summary>
        public string RequesterName { get; set; }

        /// <summary>
        /// Gets or sets the VSTS user Id.
        /// </summary>
        public Guid RequesterId { get; set; }
    }
}