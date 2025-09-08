param(
  [Parameter(Mandatory = $true)]
  [string]$OrgUrl,                  # e.g. https://dev.azure.com/canarytest

  [Parameter(Mandatory = $true)]
  [string]$Project,                 # e.g. PipelineTasks

  [Parameter(Mandatory = $true)]
  [string]$PipelineName,            # e.g. AzDev-ReleaseManagement-BitBucket-CI-Test

  [string]$Branch = 'refs/heads/main',
  [int]$TimeoutMinutes = 120,
  [int]$PollingIntervalSeconds = 30
)

$ErrorActionPreference = 'Stop'

function Get-AdoAccessToken {
  $token = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv 2>$null
  if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Failed to acquire AAD token for Azure DevOps using the Azure service connection context."
  }
  return $token
}

$orgUrl  = $OrgUrl.TrimEnd('/')
$headers = @{
  Authorization = "Bearer $(Get-AdoAccessToken)"
  'Content-Type' = 'application/json'
  'Accept'       = 'application/json'
}

# Use pipeline name to get the pipeline ID
$allPipelinesUrl = "$orgUrl/$Project/_apis/pipelines?api-version=7.1"
Write-Host "Trying to get pipeline ID by sending GET request to: $allPipelinesUrl"
$allPipelines = Invoke-RestMethod -Method GET -Uri $allPipelinesUrl -Headers $headers
$pipelineId = ($allPipelines.value | Where-Object { $_.name -eq $PipelineName } | Select-Object -First 1).id

if (-not $pipelineId) {
  throw "Pipeline '$PipelineName' not found in project '$Project'."
}
Write-Host "Resolved pipelineId: $pipelineId"

# Queue the run on the specified branch
$body = @{
  resources = @{
    repositories = @{
      self = @{
        refName = $Branch
      }
    }
  }
} | ConvertTo-Json -Depth 4

$runPipelineUrl = "$orgUrl/$Project/_apis/pipelines/$pipelineId/runs?api-version=7.1"
Write-Host "Trying to queue pipeline run by issuing POST request to: $runPipelineUrl"
$runResponse = Invoke-RestMethod -Method POST -Uri $runPipelineUrl -Headers $headers -Body $body
$runPipelineId = $runResponse.id

if (-not $runPipelineId) {
  throw "Queue failed or returned unexpected payload: $($runResponse | ConvertTo-Json -Depth 10)"
}

Write-Host "Queued external pipeline execution with run ID: $runPipelineId"
Write-Host "You can follow pipeline execution with more details here: $orgUrl/$Project/_build/results?buildId=$runPipelineId&view=results"

# Poll for completion
$ub = [System.UriBuilder]::new("$orgUrl/$Project/_apis/pipelines/$pipelineId/runs/$runPipelineId")
$ub.Query = "api-version=7.1"
$statusUrl = $ub.Uri.AbsoluteUri
Write-Host "Status of the pipeline execution will be checked by issuing GET requests to: $statusUrl"
$deadline = [DateTimeOffset]::UtcNow.AddMinutes($TimeoutMinutes)

do {
  Start-Sleep -Seconds $PollingIntervalSeconds
  $status = Invoke-RestMethod -Method GET -Uri $statusUrl -Headers $headers
  $state  = $status.state
  $result = $status.result
  Write-Host ("Timestamp={0:u} State={1} Result={2}" -f (Get-Date -AsUTC), $state, $result)

  if ([DateTimeOffset]::UtcNow -gt $deadline) {
    throw "Timed out waiting for external pipeline execution with run ID: $runPipelineId."
  }
} while ($state -ne 'completed')

if ($result -ne 'succeeded') {
  throw "External pipeline execution with run ID: $runPipelineId completed with result: $result"
}

Write-Host "External pipeline execution with run ID: $runPipelineId succeeded."