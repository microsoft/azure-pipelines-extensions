using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.ReleaseManagement.WebApi.Contracts;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace VstsServerTaskHelper.UnitTests
{
    /// <summary>
    /// Unit test class for <see cref="ArtifactHelperTests"/> class.
    /// </summary>
    [TestClass]
    public class ArtifactHelperTests
    {
        [TestMethod]
        public async Task ExtractFileContainerArtifactTest()
        {
            // given
            var expectedContent = "somestuff";
            var entryName = string.Format("{0}/{1}", Guid.NewGuid(), VstsArtifactsHelper.VstsDropJsonFileName);
            var buildClient = new MockBuildClient() { ContentStream = GetZippedStream(expectedContent, entryName) };
            var releaseClient = new MockReleaseClient();
            var gitClient = new MockGitHttpClientWrapper();
            var artifactHelper = new VstsArtifactsHelper(buildHttpClientWrapper: buildClient, releaseHttpClientWrapper: releaseClient, gitClient: gitClient, projectId: Guid.NewGuid(), repoName: "someRepo");

            // when
            var contentString = await artifactHelper.ExtractFileContainerArtifact("someArtifact", 123, default(CancellationToken));

            // then
            Assert.AreEqual(expectedContent, contentString);
        }
        
        [TestMethod]
        public async Task ExtractFileContainerArtifactFailsIfVstsDropJsonNotFoundTest()
        {
            // given
            var expectedContent = "somestuff";
            var entryName = string.Format("{0}/RANDOMNAME", Guid.NewGuid());
            var buildClient = new MockBuildClient() { ContentStream = GetZippedStream(expectedContent, entryName) };
            var gitClient = new MockGitHttpClientWrapper();
            var releaseClient = new MockReleaseClient();
            var artifactHelper = new VstsArtifactsHelper(buildHttpClientWrapper: buildClient, releaseHttpClientWrapper: releaseClient, gitClient: gitClient, projectId: Guid.NewGuid(), repoName: "someRepo");

            // when
            var throws = false;
            try
            {
                await artifactHelper.ExtractFileContainerArtifact("someArtifact", 123, default(CancellationToken));
            }
            catch (VstsArtifactsNotFoundException ex)
            {
                if (ex.Message.Contains("not found "))
                {
                    throws = true;
                }
            }
            
            // then
            Assert.IsTrue(throws);
        }

        [TestMethod]
        public async Task WaitForDropArtifactGoldenPathTest()
        {
            // given
            var expectedContent = "{\"VstsDropBuildArtifact\":{\"VstsDropUrl\":\"https://someartifacturl\"}}";
            var entryName = string.Format("{0}/{1}", Guid.NewGuid(), VstsArtifactsHelper.VstsDropJsonFileName);
            var buildClient = new MockBuildClient()
            {
                MockBuild = new Build() { Status = BuildStatus.Completed, Result = BuildResult.Succeeded },
                MockBuildArtifact = new BuildArtifact(),
                ContentStream = GetZippedStream(expectedContent, entryName),
            };
            var gitClient = new MockGitHttpClientWrapper();
            var releaseClient = new MockReleaseClient();
            var artifactHelper = new VstsArtifactsHelper(buildHttpClientWrapper: buildClient, releaseHttpClientWrapper: releaseClient, gitClient: gitClient, projectId: Guid.NewGuid(), repoName: "someRepo");

            // when
            var artifactUrl = await artifactHelper.WaitForDropArtifact("someArtifact", 123, default(CancellationToken));

            // then
            Assert.AreEqual("https://someartifacturl", artifactUrl);
        }

        [TestMethod]
        public async Task WaitForDropArtifactBuildFailedTest()
        {
            // given
            var buildClient = new MockBuildClient()
            {
                MockBuild = new Build() { Status = BuildStatus.Completed, Result = BuildResult.Failed, Repository = new BuildRepository() { Name = "someRepo" } },
            };
            var gitClient = new MockGitHttpClientWrapper();
            var releaseClient = new MockReleaseClient();
            var artifactHelper = new VstsArtifactsHelper(buildHttpClientWrapper: buildClient, releaseHttpClientWrapper: releaseClient, gitClient: gitClient, projectId: Guid.NewGuid(), repoName: "someRepo");

            // when
            var throws = false;
            try
            {
                await artifactHelper.WaitForDropArtifact("someArtifact", 123, default(CancellationToken));
            }
            catch (VstsArtifactsNotFoundException)
            {
                throws = true;
            }

            // then
            Assert.IsTrue(throws);
        }

        [TestMethod]
        public async Task WaitForDropArtifactBuildNotFoundTest()
        {
            // given
            var buildClient = new MockBuildClient()
            {
                ReturnNullBuild = true,
            };
            var releaseClient = new MockReleaseClient();
            var gitClient = new MockGitHttpClientWrapper();
            var artifactHelper = new VstsArtifactsHelper(buildHttpClientWrapper: buildClient, releaseHttpClientWrapper: releaseClient, gitClient: gitClient, projectId: Guid.NewGuid(), repoName: "someRepo");

            // when
            var throws = false;
            try
            {
                await artifactHelper.WaitForDropArtifact("someArtifact", 123, default(CancellationToken));
            }
            catch (ArgumentException)
            {
                throws = true;
            }

            // then
            Assert.IsTrue(throws);
        }

        [TestMethod]
        public async Task TryGetArtifactBuildIdFromRelease_NoArtifactDefinitionsTest()
        {
            // given
            var releaseClient = new MockReleaseClient()
            {
                MockArtifactDefinitions = new List<AgentArtifactDefinition>(),
            };
            var gitClient = new MockGitHttpClientWrapper();
            var buildClient = new MockBuildClient();
            var artifactHelper = new VstsArtifactsHelper(buildClient, releaseClient, gitClient, Guid.NewGuid(), "someRepo");

            // when
            var throws = false;
            try
            {
                await artifactHelper.TryGetArtifactBuildIdFromRelease(123, "someAlias", default(CancellationToken));
            }
            catch (VstsArtifactsNotFoundException)
            {
                throws = true;
            }

            // then
            Assert.IsTrue(throws);
        }

        [TestMethod]
        public async Task TryGetArtifactBuildIdFromRelease_NullArtifactSourceAliasTest()
        {
            // given
            var mockArtifactDefinitions = new List<AgentArtifactDefinition>()
            {
                new AgentArtifactDefinition()
                {
                    Version = "123",
                }
            };

            var releaseClient = new MockReleaseClient()
            {
                MockArtifactDefinitions = mockArtifactDefinitions,
            };
            var gitClient = new MockGitHttpClientWrapper();
            var buildClient = new MockBuildClient();
            var artifactHelper = new VstsArtifactsHelper(buildClient, releaseClient, gitClient, Guid.NewGuid(), "someRepo");

            // when
            var result = await artifactHelper.TryGetArtifactBuildIdFromRelease(123, null, default(CancellationToken));

            // then
            Assert.IsNotNull(result);
            Assert.AreEqual(false, result.Failed);
            Assert.AreEqual(123, result.DropSourceBuildId);
        }

        [TestMethod]
        public async Task TryGetArtifactBuildIdFromRelease_MatchingArtifactSourceAliasTest()
        {
            // given
            var mockArtifactDefinitions = new List<AgentArtifactDefinition>()
            {
                new AgentArtifactDefinition()
                {
                    Alias = "someAlias",
                    Version = "123",
                },
                new AgentArtifactDefinition()
                {
                    Alias = "matchingAlias",
                    Version = "456",
                },
            };

            var releaseClient = new MockReleaseClient()
            {
                MockArtifactDefinitions = mockArtifactDefinitions,
            };
            var gitClient = new MockGitHttpClientWrapper();
            var buildClient = new MockBuildClient();
            var artifactHelper = new VstsArtifactsHelper(buildClient, releaseClient, gitClient, Guid.NewGuid(), "someRepo");

            // when
            var result = await artifactHelper.TryGetArtifactBuildIdFromRelease(123, "matchingAlias", default(CancellationToken));

            // then
            Assert.IsNotNull(result);
            Assert.AreEqual(false, result.Failed);
            Assert.AreEqual(456, result.DropSourceBuildId);
        }

        [TestMethod]
        public async Task TryGetArtifactBuildIdFromRelease_NoMatchingArtifactSourceAliasTest()
        {
            // given
            var mockArtifactDefinitions = new List<AgentArtifactDefinition>()
            {
                new AgentArtifactDefinition()
                {
                    Alias = "someAlias",
                    Version = "123",
                }
            };

            var releaseClient = new MockReleaseClient()
            {
                MockArtifactDefinitions = mockArtifactDefinitions,
            };
            var gitClient = new MockGitHttpClientWrapper();
            var buildClient = new MockBuildClient();
            var artifactHelper = new VstsArtifactsHelper(buildClient, releaseClient, gitClient, Guid.NewGuid(), "someRepo");

            // when
            var throws = false;
            try
            {
                await artifactHelper.TryGetArtifactBuildIdFromRelease(123, "otherAlias", default(CancellationToken));
            }
            catch (VstsArtifactsNotFoundException)
            {
                throws = true;
            }

            // then
            Assert.IsTrue(throws);
        }
        
        [TestMethod]
        public async Task UncDropPathTest()
        {
            // given
            var expectedDropPath = @"\\unistore\drops\whatever";
            var artifactHelper = FromArtifactResource(new ArtifactResource()
                   {
                      Data = expectedDropPath,
                      Type = "FilePath"
                   });
            var artifactresult = await artifactHelper.TryGetDropUrlOrUncFromBuildArtifact("someArtifact", 123, default(CancellationToken));
            var uncresult = artifactresult as VstsArtifactsHelper.ArtifactsUncResult;
            Assert.AreEqual(expectedDropPath, uncresult.UncPath);
        }
        
         [TestMethod]
        public async Task BadArtifactResourceTypeTest()
        {
            // given
            var expectedDropPath = @"\\unistore\drops\whatever";
            var artifactHelper = FromArtifactResource(new ArtifactResource()
                   {
                      Data = expectedDropPath,
                      Type = "SomethingWierd"
                   });

            // when
            try 
            {
                await artifactHelper.TryGetDropUrlOrUncFromBuildArtifact("someArtifact", 123, default(CancellationToken));
                Assert.Fail("Should have thrown");
            }
            catch (VstsArtifactsNotFoundException)
            { 
            }
        }
        
         [TestMethod]
        public async Task BadUncPathTest()
        {
            var badDropPath = @"Totally not a uncpath";
            var artifactHelper = FromArtifactResource(new ArtifactResource()
                   {
                      Data = badDropPath,
                      Type = "FilePath"
                   });
            try 
            {
                await artifactHelper.TryGetDropUrlOrUncFromBuildArtifact("someArtifact", 123, default(CancellationToken));
                Assert.Fail("Should have thrown");
            }
            catch (VstsArtifactsNotFoundException)
            { 
            }
        }
        
        private VstsArtifactsHelper FromArtifactResource(ArtifactResource r)
        {
            var gitClient = new MockGitHttpClientWrapper();
            var releaseClient = new MockReleaseClient();
            var buildClient = new MockBuildClient()
            {
                MockBuildArtifact = new BuildArtifact() 
                {
                   Resource = r
                }
            };
            return new VstsArtifactsHelper(buildHttpClientWrapper: buildClient, releaseHttpClientWrapper: releaseClient, gitClient: gitClient, projectId: Guid.NewGuid(), repoName: "someRepo");
        }

        private static MemoryStream GetZippedStream(string expectedContent, string entryName)
        {
            // from http://stackoverflow.com/questions/17232414/creating-a-zip-archive-in-memory-using-system-io-compression
            var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                var archiveEntry = archive.CreateEntry(entryName);

                using (var entryStream = archiveEntry.Open())
                {
                    using (var streamWriter = new StreamWriter(entryStream))
                    {
                        streamWriter.Write(expectedContent);
                    }
                }
            }

            memoryStream.Seek(0, SeekOrigin.Begin);
            return memoryStream;
        }
    }
}
