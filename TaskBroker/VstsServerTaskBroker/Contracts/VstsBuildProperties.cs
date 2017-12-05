namespace VstsServerTaskHelper
{
    public class VstsBuildProperties
    {
        /// <summary>
        /// Gets or sets the VSTS Build ID.
        /// </summary>
        public int BuildId { get; set; }

        /// <summary>
        /// Gets or sets the name of the build definition.
        /// </summary>
        public string BuildName { get; set; }

        /// <summary>
        /// Gets or sets the latest version control change that is included in this build.
        /// Git: The commit ID.
        /// TFVC: the changeset.
        /// </summary>
        public string SourceVersion { get; set; }

        /// <summary>
        /// Gets or sets the branch the build was queued for.
        /// </summary>
        public string SourceBranch { get; set; }

        /// <summary>
        /// Gets or sets the Source Control Server.
        /// </summary>
        public string SourceControlServerUri { get; set; }

        /// <summary>
        /// Gets or sets the name of the repository.
        /// </summary>
        public string RepositoryName { get; set; }
    }
}