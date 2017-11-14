using System;

namespace VstsServerTaskHelper
{
    public class VstsReleaseProperties
    {
        /// <summary>
        /// Gets or sets the VSTS Release ID.
        /// </summary>
        public int ReleaseId { get; set; }

        /// <summary>
        /// Gets or sets the name of the release.
        /// </summary>
        public string ReleaseName { get; set; }

        /// <summary>
        /// Gets or sets the name of the release definition
        /// </summary>
        public string ReleaseDefinitionName { get; set; }

        /// <summary>
        /// Gets or sets the name of the release environment
        /// </summary>
        public string ReleaseEnvironmentName { get; set; }

        /// <summary>
        /// Gets or sets the URL for the release environment
        /// </summary>
        public Uri ReleaseEnvironmentUri { get; set; }

        /// <summary>
        /// Gets or sets the URL for the release
        /// </summary>
        public Uri ReleaseUri { get; set; }
    }
}