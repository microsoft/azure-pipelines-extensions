namespace VstsServerTaskBroker.Contracts
{
	public class VstsDropBuildArtifactWrapper
    {
        /// <summary>
        /// Gets or sets legacy drop url for backcompat only. Can be removed once CB agentless is updated to output the correct JSON
        /// TODO: required for backcompat until the release artifact format issue is fixed. Can be deleted once CloudBuild fix is shipped 
        /// TODO: tracking bug (https://msasg.visualstudio.com/Engineering%20Fundamentals/_workitems/edit/633400)
        /// </summary>
        public string VstsDropUrl { get; set; }

        /// <summary>
        /// Gets or sets the drop artifact metadata JSON 
        /// </summary>
        public VstsDropBuildArtifact VstsDropBuildArtifact { get; set; }
    }

    public class VstsDropBuildArtifact
    {
        public string VstsDropUrl { get; set; }
    }
}
