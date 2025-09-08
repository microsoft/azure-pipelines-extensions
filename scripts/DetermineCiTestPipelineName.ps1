param(
  [Parameter(Mandatory = $true)]
  [string]$ExtensionName,

  # Name of the variable to set in the pipeline
  [string]$AdoVariableName = 'TARGET_PIPELINE_NAME'
)

$ErrorActionPreference = 'Stop'

switch ($ExtensionName) {
  'Ansible'         { $pipelineName = 'AzDev-ReleaseManagement-Ansible-CI-Test' }
  'BitBucket'       { $pipelineName = 'AzDev-ReleaseManagement-BitBucket-CI-Test' }
  'ExternalTfs'     { $pipelineName = 'AzDev-ReleaseManagement-ExternalTFS-CI-Test' }
  'IISWebAppDeploy' { $pipelineName = 'AzDev-ReleaseManagement-IIS-Test' }
  default {
    throw "Pipeline name can't be determined for extension '$ExtensionName'. Update the mapping."
  }
}

Write-Host "Mapping: $ExtensionName -> $pipelineName"
# Make it available to later steps in the job
Write-Host "##vso[task.setvariable variable=$AdoVariableName;]$pipelineName"