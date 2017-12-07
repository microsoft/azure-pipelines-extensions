using System;

namespace VstsServerTaskHelper
{
    public class VstsPlanProperties
    {
        /// <summary>
        /// Gets or sets the task log id. This value is set internally and should not be set from the task.
        /// </summary>
        public int TaskLogId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS build definition plan Id.
        /// </summary>
        public Guid PlanId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Hub.
        /// </summary>
        public HubType VstsHub { get; set; }

        /// <summary>
        /// Gets or sets the VSTS project name.
        /// </summary>
        public string ProjectName { get; set; }

        /// <summary>
        /// Gets or sets the VSTS project id.
        /// </summary>
        public Guid ProjectId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Build Job ID.
        /// </summary>
        public Guid JobId { get; set; }

        /// <summary>
        /// Gets or sets the VSTS Build timeline Id.
        /// </summary>
        public Guid TimelineId { get; set; }

        /// <summary>
        /// Gets or sets the URL for Build/Release Plan APIs.
        /// </summary>
        public string VstsPlanUrl { get; set; }

        /// <summary>
        /// Gets or sets the URI for Build/Release Plan APIs.
        /// </summary>
        public Uri VstsPlanUri { get; set; }

        /// <summary>
        /// Gets or sets the URL of the team foundation collection.
        /// </summary>
        public string VstsUrl { get; set; }

        /// <summary>
        /// Gets or sets the URI of the team foundation collection.
        /// </summary>
        public Uri VstsUri { get; set; }

        /// <summary>
        /// Gets or sets the authToken for the given build request.
        /// This token will be used to send the build progress updates back to VSTS.
        /// </summary>
        public string AuthToken { get; set; }
    }
}