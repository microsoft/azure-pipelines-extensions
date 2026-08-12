# Bitbucket&reg; artifacts for Release management

This extension integrates Bitbucket&reg; with Azure Pipelines. It provides a **Bitbucket&reg; service connection** and a **Download Artifacts - Bitbucket** task, so you can consume Bitbucket&reg; repository sources from both **classic release pipelines** and **YAML pipelines** in Azure DevOps.

## Usage
Using the extension is a two-step workflow: (1) create a **Bitbucket&reg; service connection** in your project with your Bitbucket authentication details, then (2) reference that connection from a release-pipeline artifact source or from a **`DownloadArtifactsBitbucket`** task in a YAML pipeline.

### Connecting to a Bitbucket&reg; project
Go to project settings -> Service connections tab and create a New Service Endpoint of type Bitbucket&reg;:
![Creating a Bitbucket&reg; endpoint connection](images/screen1.png)

### Authentication
Bitbucket&reg; service connections support OAuth authentication. Configure the service connection with the `OAuth` authorization scheme and provide the OAuth access token in the `AccessToken`, `token`, or `access_token` authorization parameter. Parameter names are case-insensitive.

OAuth access tokens are sent as Bearer tokens when the extension calls the Bitbucket&reg; API. When repositories are cloned, the extension uses `x-token-auth` as the Git username and the OAuth access token as the password.

Existing `Token` and `UsernamePassword` authorization schemes continue to be supported. `OAuth2` is also accepted for compatibility with custom service connections.

### Linking Bitbucket&reg; sources
Once you have set up the service endpoint connection, you can link Bitbucket&reg; repository sources in your release definition.
![Linking Bitbucket&reg; artifact](images/screen2.png)

### Using in YAML pipelines
Add the `DownloadArtifactsBitbucket` task to a YAML pipeline to clone a Bitbucket&reg; repository at a selected branch and commit into the agent workspace:

```yaml
steps:
  - task: DownloadArtifactsBitbucket@15
    inputs:
      connection: 'MyBitbucketConnection'        # Service connection name
      definition: 'workspace/repository'         # Bitbucket repository full name
      branch: 'refs/heads/main'                  # Branch to checkout
      version: '1234567890abcdef1234567890abcdef12345678' # Commit id
      downloadPath: '$(Build.SourcesDirectory)/bitbucket'
```

[Learn more about artifacts in Azure Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/artifacts). You can use [Azure Pipeline Extensions on GitHub](https://github.com/microsoft/azure-pipelines-extensions/issues) to report issues.

**Note:** Bitbucket&reg; is a trademark owned by Atlassian.
