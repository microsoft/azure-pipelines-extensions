using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Common;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace VstsServerTaskHelper
{
    public class VstsArtifactsHelper : IArtifactsHelper
    {
        internal const string VstsDropJsonFileName = "VSTSDrop.json";

        public abstract class ArtifactsResult
        {
            public bool Failed { get; set; }

            public string FailureReason { get; set; }
        }

        public class ArtifactsDropResult : ArtifactsResult
        {
            public string DropUrl { get; set; }
        }

        public class ArtifactsUncResult : ArtifactsResult
        {
            public string UncPath { get; set; }
        }

        public class ArtifactsBuildResult : ArtifactsResult
        {
            public int DropSourceBuildId { get; set; }
        }

        private static readonly string RefsPullPullidDMergeMatchString = @"refs/pull/(?<PullId>\d+)/merge";
        private static readonly Regex PullRequestRegex = new Regex(RefsPullPullidDMergeMatchString, RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private readonly IGitClient gitClient;
        private readonly IBuildClient buildClient;
        private readonly IReleaseClient releaseClient;
        private readonly Guid projectId;
        private readonly string repoName;

        public VstsArtifactsHelper(IBuildClient buildClient, IReleaseClient releaseClient, IGitClient gitClient, Guid projectId, string repoName)
        {
            this.buildClient = buildClient;
            this.releaseClient = releaseClient;
            this.gitClient = gitClient;
            this.projectId = projectId;
            this.repoName = repoName;
        }

        public static VstsArtifactsHelper CreateArtifactsHelper(VstsMessage vstsContext)
        {
            var buildHttpClientWrapper = new BuildClient(vstsContext.VstsUri, new VssBasicCredential(string.Empty, vstsContext.AuthToken));
            var gitClient = new GitClient(vstsContext.VstsUri, new VssBasicCredential(string.Empty, vstsContext.AuthToken));
            var releaseClient = new ReleaseClient(vstsContext.VstsPlanUri, new VssBasicCredential(string.Empty, vstsContext.AuthToken));
            var repositoryName = vstsContext.BuildProperties != null ? vstsContext.BuildProperties.RepositoryName : string.Empty;
            return new VstsArtifactsHelper(buildHttpClientWrapper, releaseClient, gitClient, vstsContext.ProjectId, repositoryName);
        }

        public async Task<ArtifactsDropResult> TryGetDropUrlFromBuildArtifact(string dropArtifactsName, int buildId, CancellationToken cancellationToken)
        {
            var result = new ArtifactsDropResult();

            try
            {
                // this might throw artifactnotfound instead of vstsartifactsnotfound. 
                var artifactContent = await this.ExtractFileContainerArtifact(dropArtifactsName, buildId, cancellationToken).ConfigureAwait(false);
                
                var dropArtifact = JsonConvert.DeserializeObject<VstsDropBuildArtifactWrapper>(artifactContent);

                // TODO: required for backcompat until the release artifact format issue is fixed. Can be deleted once CloudBuild fix is shipped 
                // TODO: tracking bug (https://msasg.visualstudio.com/Engineering%20Fundamentals/_workitems/edit/633400)
                var vstsDropUrl = dropArtifact.VstsDropBuildArtifact != null ? dropArtifact.VstsDropBuildArtifact.VstsDropUrl : dropArtifact.VstsDropUrl;

                if (string.IsNullOrEmpty(vstsDropUrl))
                {
                    result.Failed = true;
                    result.FailureReason = string.Format("Failed to retrieve valid artifacts [{0}] from build", dropArtifactsName);
                }
                else
                {
                    result.DropUrl = vstsDropUrl;
                    result.Failed = false;
                }
            }
            catch (Exception ex)
            {
                result.Failed = true;
                result.FailureReason = string.Format("Failed to retrieve valid artifacts [{0}] with exception [{1}] {2}", dropArtifactsName, ex.GetType().Name, ex.Message);
            }

            return result;
        }

        // Handle UNC or Vsts Drop url artifacts
        // example artifact returns
        // https://microsoft.visualstudio.com/Universal%20Store/_apis/build/builds/4430645/artifacts?api-version=2.0
        // {"count":1,"value":[{"id":2427574,"name":"Deployment","resource":{"type":"FilePath","data":"\\\\unistore\\build\\MCKP.Jarvis.Sqlizer.Jaql.Int\\20170414.1","properties":{"artifactlocation":"\\\\unistore\\build\\MCKP.Jarvis.Sqlizer.Jaql.Int\\20170414.1"},"url":"https://microsoft.visualstudio.com/e8efa521-db8e-4531-9cd8-6923807c7e83/_apis/build/builds/4430645/artifacts?artifactName=Deployment","downloadUrl":"file://unistore/build/MCKP.Jarvis.Sqlizer.Jaql.Int/20170414.1"}}]}
        // https://msasg.visualstudio.com/Engineering%20Fundamentals/_apis/build/builds/340016/artifacts?api-version=2.0
        // {"count":1,"value":[{"id":109196,"name":"DropMetaData","resource":{"type":"Container","data":"#/363568/a07dffde-d99e-42d3-bda5-45b6678893d4","properties":{},"url":"https://msasg.visualstudio.com/b03927a9-4d41-4a29-865d-b1d980f6dee9/_apis/build/builds/340016/artifacts?artifactName=DropMetaData","downloadUrl":"https://msasg.visualstudio.com/b03927a9-4d41-4a29-865d-b1d980f6dee9/_apis/build/builds/340016/artifacts?artifactName=DropMetaData&%24format=zip"}}]}
        public async Task<ArtifactsResult> TryGetDropUrlOrUncFromBuildArtifact(string dropArtifactsName, int buildId, CancellationToken cancellationToken)
        {
            var artifact = await this.buildClient.GetArtifactAsync(this.projectId, buildId, dropArtifactsName, cancellationToken).ConfigureAwait(false);
            if (artifact == null)
            {
                 throw new VstsArtifactsNotFoundException(string.Format("artifact ({1}) not found", dropArtifactsName));
            }

            // why didn't we use ArtifactResource.Url or ArtifactResource.Downloadurl?
            if (artifact.Resource.Type.Equals("Container", StringComparison.OrdinalIgnoreCase))
            {
                return await this.TryGetDropUrlFromBuildArtifact(dropArtifactsName, buildId, cancellationToken).ConfigureAwait(false);
            }
            else if (artifact.Resource.Type.Equals("FilePath", StringComparison.OrdinalIgnoreCase))
            {
                if (artifact.Resource.Data == null || !artifact.Resource.Data.StartsWith("\\\\"))
                {
                    throw new VstsArtifactsNotFoundException("FilePath artifact did not start with \\\\ : " + (artifact.Resource.Data ?? "null") );
                }

                return new ArtifactsUncResult
                { 
                    Failed = false,
                    UncPath = artifact.Resource.Data
                };
            }

            throw new VstsArtifactsNotFoundException(string.Format("Artifact of type {0} is unsupported", artifact.Resource.Type));
        }

        public async Task<ArtifactsBuildResult> TryGetArtifactBuildIdFromPullRequestMergeBranch(string sourceBranch, string buildDefName, CancellationToken cancellationToken)
        {
            try
            {
                var pullRequestId = await this.FindPullRequestForBranch(sourceBranch, cancellationToken).ConfigureAwait(false);
                var overrideBuildId = await this.FindPolicyBuildInstance(pullRequestId, buildDefName, cancellationToken).ConfigureAwait(false);

                return new ArtifactsBuildResult()
                {
                    Failed = false,
                    DropSourceBuildId = overrideBuildId,
                };
            }
            catch (VstsArtifactsNotFoundException ex)
            {
                return new ArtifactsBuildResult()
                {
                    Failed = true,
                    FailureReason = ex.Message,
                };
            }
        }

        public async Task<ArtifactsBuildResult> TryGetArtifactBuildIdFromRelease(int releaseId, string artifactSourceAlias, CancellationToken cancellationToken)
        {
            var agentArtifactDefinitions = await this.releaseClient.GetAgentArtifactDefinitionsAsync(this.projectId, releaseId, cancellationToken).ConfigureAwait(false);

            var agentArtifactDefinition = string.IsNullOrEmpty(artifactSourceAlias) ? agentArtifactDefinitions.FirstOrDefault() : agentArtifactDefinitions.FirstOrDefault(def => def.Alias.Equals(artifactSourceAlias));

            if (agentArtifactDefinition == null)
            {
                throw new VstsArtifactsNotFoundException(string.Format("Artifact definition for release [{0}] with artifact source alias [{1}] not found", releaseId, artifactSourceAlias));
            }

            int buildId;
            if (!int.TryParse(agentArtifactDefinition.Version, out buildId))
            {
                throw new VstsArtifactsNotFoundException(string.Format("Release not triggered with build? Build ID not found in artifact definition [{0}]", agentArtifactDefinition.Version));
            }
            
            return new ArtifactsBuildResult()
            {
                Failed = false,
                DropSourceBuildId = buildId,
            };
        }

        public async Task<string> WaitForDropArtifact(string dropArtifactsName, int buildId, CancellationToken cancellationToken)
        {
            var retryUpdatingBuildInSec = TimeSpan.FromSeconds(15);
            while (true)
            {
                // abort?
                cancellationToken.ThrowIfCancellationRequested();

                // did the build fail?
                var build = await this.buildClient.GetBuildAsync(this.projectId, buildId, cancellationToken).ConfigureAwait(false);
                AssertBuildIsValid(buildId, build);

                if (build.Status.HasValue && build.Status == BuildStatus.Completed && build.Result.HasValue && build.Result == BuildResult.Succeeded)
                {
                    // can the artifact be found?
                    var artifact = await this.buildClient.GetArtifactAsync(this.projectId, buildId, dropArtifactsName, cancellationToken).ConfigureAwait(false);
                    if (artifact != null)
                    {
                        var dropResult = await this.TryGetDropUrlFromBuildArtifact(dropArtifactsName, buildId, cancellationToken).ConfigureAwait(false);
                        if (dropResult.Failed)
                        {
                            throw new VstsArtifactsNotFoundException(string.Format("Failed to download drop for artifact {0} with error {1}", dropArtifactsName, dropResult.FailureReason));
                        }

                        return dropResult.DropUrl;
                    }
                }

                // is build in a terminal state?
                if (build.Status == BuildStatus.Completed || build.Status == BuildStatus.Cancelling || build.Status == BuildStatus.Postponed)
                {
                    throw new VstsArtifactsNotFoundException(string.Format("Artifacts [{0}] not found for build in terminal state [{1}] with result [{2}]", dropArtifactsName, build.Status, build.Result));
                }

                await Task.Delay(retryUpdatingBuildInSec, cancellationToken).ConfigureAwait(false);
            }
        }

        internal async Task<int> FindPolicyBuildInstance(int pullRequestId, string overrideBuildDefName, CancellationToken cancellationToken)
        {
            // find the buid def
            var buildDef = await this.buildClient.GetBuildDefinitionAsync(this.projectId, overrideBuildDefName, cancellationToken).ConfigureAwait(false);
            if (buildDef == null)
            {
                throw new VstsArtifactsNotFoundException(string.Format("Override build definition [{0}] not found. Please check CloudTest build task configuration", overrideBuildDefName));
            }

            // get policies and find build inst
            var evaluations = await this.gitClient.GetPolicyEvaluations(this.projectId, pullRequestId, cancellationToken).ConfigureAwait(false);
            var buildPolicy = evaluations.FirstOrDefault(
                c =>
                {
                    JToken buildDefToken;
                    if (c.Context != null && c.Context.TryGetValue("buildDefinitionId", out buildDefToken))
                    {
                        if (buildDefToken.Type == JTokenType.Integer)
                        {
                            var buildDefId = buildDefToken.Value<int?>();
                            return (buildDefId.HasValue && buildDefId.Value == buildDef.Id);
                        }
                    }

                    return false;
                });

            if (buildPolicy == null)
            {
                throw new VstsArtifactsNotFoundException(string.Format("Could not find a PR Build Policy that uses the build definition [{0}]. Please check branch policy configuration for this PR", overrideBuildDefName));
            }

            // extract the build id
            JToken buildIdToken;
            if (buildPolicy.Context.TryGetValue("buildId", out buildIdToken))
            {
                if (buildIdToken.Type == JTokenType.Integer)
                {
                    var buildId = buildIdToken.Value<int?>();
                    if (buildId.HasValue)
                    {
                        return buildId.Value;
                    }
                }
            }

            JToken buildPolicyName;
            string policyName = string.Format("Policy for {0}", overrideBuildDefName);
            if (buildPolicy.Configuration.Settings.TryGetValue("displayName", out buildPolicyName))
            {
                if (buildPolicyName.Type == JTokenType.String)
                {
                    policyName = buildPolicyName.Value<string>();
                }
            }

            throw new VstsArtifactsNotFoundException(string.Format("Unable to find a BuildId for the build policy [{0}] please check the PR to queue the policy", policyName));
        }

        internal async Task<int> FindPullRequestForBranch(string sourceBranch, CancellationToken cancellationToken)
        {
            // resolve PR id for this branch
            var pullRequestMatch = PullRequestRegex.Match(sourceBranch);
            if (!pullRequestMatch.Success)
            {
                throw new VstsArtifactsNotFoundException(string.Format("Branch [{0}] is not a PR. Does not match pattern[{1}]", sourceBranch, RefsPullPullidDMergeMatchString));
            }

            var pullIdString = pullRequestMatch.Groups["PullId"].Value;
            int pullRequestId;
            if (!int.TryParse(pullIdString, out pullRequestId))
            {
                throw new VstsArtifactsNotFoundException(string.Format("Branch is not a PR? Pull request ID not found in branch name [{0}]", sourceBranch));
            }

            var pullRequest = await this.gitClient.GetPullRequestAsync(
                this.projectId,
                this.repoName,
                pullRequestId,
                cancellationToken).ConfigureAwait(false);

            if (pullRequest == null)
            {
                throw new VstsArtifactsNotFoundException(string.Format("Pull request [{0}] not found", pullRequestId));
            }

            return pullRequestId;
        }

        internal async Task<string> ExtractFileContainerArtifact(string artifactName, int buildId, CancellationToken cancellationToken)
        {
            using (var zipStream = await this.buildClient.GetArtifactContentZipAsync(this.projectId, buildId, artifactName, cancellationToken).ConfigureAwait(false))
            {
                var zipArchive = new ZipArchive(zipStream, ZipArchiveMode.Read);
                var entry = zipArchive.Entries.FirstOrDefault(e => string.Equals(e.Name, VstsDropJsonFileName, StringComparison.OrdinalIgnoreCase));
                if (entry == null)
                {
                    throw new VstsArtifactsNotFoundException(string.Format("Drop JSON ({0}) not found in artifact ({1})", VstsDropJsonFileName, artifactName));
                }

                using (var reader = new StreamReader(entry.Open()))
                {
                    var contentString = await reader.ReadToEndAsync().ConfigureAwait(false);
                    return contentString;
                }
            }
        }
        
        private static void AssertBuildIsValid(int buildId, Build build)
        {
            if (build == null)
            {
                throw new ArgumentException(string.Format("Build [{0}] not found", buildId));
            }

            var buildFailed = false;
            buildFailed |= build.Status == BuildStatus.Cancelling;
            buildFailed |= build.Status == BuildStatus.Postponed;
            buildFailed |= (build.Status == BuildStatus.Completed && build.Result.HasValue && (build.Result == BuildResult.Canceled || build.Result == BuildResult.Failed));

            if (buildFailed)
            {
                throw new VstsArtifactsNotFoundException(string.Format("Build {0} on {1} completed with failure status ({2}-{3})", build.Id, build.Repository.Name, build.Status, build.Result));
            }
        }
    }
}
