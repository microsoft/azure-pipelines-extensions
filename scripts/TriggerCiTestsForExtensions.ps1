<#
.SYNOPSIS
  Triggers CI test pipelines for all detected extensions and waits for results.

.DESCRIPTION
  Maps extensions to CI test pipelines, triggers them in parallel, polls until
  completion, and reports results. Fails if any pipeline fails.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Extensions,

    [Parameter(Mandatory = $true)]
    [string]$OrgUrl,

    [Parameter(Mandatory = $true)]
    [string]$Project,

    [string]$Branch = 'refs/heads/main',
    [int]$TimeoutMinutes = 120,
    [int]$PollingIntervalSeconds = 30
)

$ErrorActionPreference = 'Stop'

# ── Extension → CI test pipeline mapping ──
$pipelineMapping = @{
    'Ansible'         = 'AzDev-ReleaseManagement-Ansible-CI-Test'
    'BitBucket'       = 'AzDev-ReleaseManagement-BitBucket-CI-Test'
    'ExternalTfs'     = 'AzDev-ReleaseManagement-ExternalTFS-CI-Test'
    'IISWebAppDeploy' = 'AzDev-ReleaseManagement-IIS-Test'
}

# ── Parse extensions ──
$extensionList = $Extensions.Split(';', [System.StringSplitOptions]::RemoveEmptyEntries) | ForEach-Object { $_.Trim() }

if ($extensionList.Count -eq 0) {
    throw "No extensions provided. Extensions parameter: '$Extensions'"
}

Write-Host "=== CI Test Orchestrator ==="
Write-Host "Extensions to test: $($extensionList -join ', ')"
Write-Host "Org URL            : $OrgUrl"
Write-Host "Project            : $Project"

# ── Resolve pipeline names ──
$extensionsToTest = @()
$skippedExtensions = @()

foreach ($ext in $extensionList) {
    if ($pipelineMapping.ContainsKey($ext)) {
        $extensionsToTest += @{ Extension = $ext; PipelineName = $pipelineMapping[$ext] }
    } else {
        Write-Host "##[warning]No CI test pipeline mapping for '$ext'. Skipping."
        $skippedExtensions += $ext
    }
}

if ($extensionsToTest.Count -eq 0) {
    Write-Host "##[warning]None of the detected extensions have CI test pipeline mappings."
    Write-Host "Extensions without mappings: $($skippedExtensions -join ', ')"
    return
}

Write-Host "`nExtensions with CI tests ($($extensionsToTest.Count)):"
$extensionsToTest | ForEach-Object { Write-Host "  $($_.Extension) -> $($_.PipelineName)" }

if ($skippedExtensions.Count -gt 0) {
    Write-Host "`nSkipped (no mapping): $($skippedExtensions -join ', ')"
}

# ── Get AAD token ──
function Get-AdoAccessToken {
    $token = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv 2>$null
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "Failed to acquire AAD token for Azure DevOps."
    }
    return $token
}

$orgUrl = $OrgUrl.TrimEnd('/')
$headers = @{
    Authorization  = "Bearer $(Get-AdoAccessToken)"
    'Content-Type' = 'application/json'
    'Accept'       = 'application/json'
}

# ── Fetch pipeline definitions ──
$allPipelinesUrl = "$orgUrl/$Project/_apis/pipelines?api-version=7.1"
Write-Host "`nFetching pipeline definitions from: $allPipelinesUrl"
$allPipelines = Invoke-RestMethod -Method GET -Uri $allPipelinesUrl -Headers $headers

# ── Trigger all CI test pipelines ──
$body = @{
    resources = @{
        repositories = @{
            self = @{ refName = $Branch }
        }
    }
} | ConvertTo-Json -Depth 4

$runningBuilds = @()

Write-Host "`n=== Triggering CI test pipelines ==="
foreach ($entry in $extensionsToTest) {
    $ext = $entry.Extension
    $pipelineName = $entry.PipelineName

    $pipelineId = ($allPipelines.value | Where-Object { $_.name -eq $pipelineName } | Select-Object -First 1).id
    if (-not $pipelineId) {
        Write-Host "##[warning]Pipeline '$pipelineName' not found in project '$Project'. Skipping $ext."
        $skippedExtensions += $ext
        continue
    }

    $runUrl = "$orgUrl/$Project/_apis/pipelines/$pipelineId/runs?api-version=7.1"
    Write-Host "  Triggering: $ext -> $pipelineName (pipelineId=$pipelineId)"

    try {
        $runResponse = Invoke-RestMethod -Method POST -Uri $runUrl -Headers $headers -Body $body
        $runId = $runResponse.id
        if (-not $runId) {
            Write-Host "##[warning]Failed to queue pipeline for $ext."
            $skippedExtensions += $ext
            continue
        }

        $buildUrl = "$orgUrl/$Project/_build/results?buildId=$runId&view=results"
        Write-Host "    Queued run ID: $runId — $buildUrl"

        $runningBuilds += @{
            Extension  = $ext
            PipelineId = $pipelineId
            RunId      = $runId
            BuildUrl   = $buildUrl
            State      = 'inProgress'
            Result     = $null
        }
    } catch {
        Write-Host "##[warning]Error triggering pipeline for $ext : $_"
        $skippedExtensions += $ext
    }
}

if ($runningBuilds.Count -eq 0) {
    Write-Host "##[warning]No CI test pipelines were successfully triggered."
    return
}

# ── Poll all pipelines until completion ──
Write-Host "`n=== Waiting for $($runningBuilds.Count) pipeline(s) to complete ==="
$deadline = [DateTimeOffset]::UtcNow.AddMinutes($TimeoutMinutes)

do {
    Start-Sleep -Seconds $PollingIntervalSeconds
    $headers.Authorization = "Bearer $(Get-AdoAccessToken)"

    $allDone = $true
    foreach ($build in $runningBuilds) {
        if ($build.State -eq 'completed') { continue }

        $statusUrl = "$orgUrl/$Project/_apis/pipelines/$($build.PipelineId)/runs/$($build.RunId)?api-version=7.1"
        try {
            $status = Invoke-RestMethod -Method GET -Uri $statusUrl -Headers $headers
            $build.State = $status.state
            $build.Result = $status.result
        } catch {
            Write-Host "##[warning]Error polling $($build.Extension) (runId=$($build.RunId)): $_"
        }

        if ($build.State -ne 'completed') { $allDone = $false }
    }

    $timestamp = Get-Date -AsUTC -Format 'u'
    $summary = ($runningBuilds | ForEach-Object {
        "$($_.Extension)=$($_.State)$(if ($_.Result) { "($($_.Result))" })"
    }) -join '  |  '
    Write-Host "[$timestamp] $summary"

    if ([DateTimeOffset]::UtcNow -gt $deadline) {
        $incomplete = ($runningBuilds | Where-Object { $_.State -ne 'completed' } | ForEach-Object { $_.Extension }) -join ', '
        throw "Timed out after $TimeoutMinutes minutes. Still running: $incomplete"
    }
} while (-not $allDone)

# ── Report results ──
Write-Host "`n=== CI Test Results ==="

$failed = @()
$succeeded = @()

foreach ($build in $runningBuilds) {
    $icon = if ($build.Result -eq 'succeeded') { '✅' } else { '❌' }
    Write-Host "  $icon $($build.Extension): $($build.Result) — $($build.BuildUrl)"
    if ($build.Result -eq 'succeeded') { $succeeded += $build.Extension } else { $failed += $build.Extension }
}

if ($skippedExtensions.Count -gt 0) {
    Write-Host "  ⏭️  Skipped (no CI mapping): $($skippedExtensions -join ', ')"
}

Write-Host "`nSucceeded: $($succeeded.Count)/$($runningBuilds.Count)"
if ($failed.Count -gt 0) {
    Write-Host "Failed   : $($failed.Count)/$($runningBuilds.Count) — $($failed -join ', ')"
    throw "CI tests failed for: $($failed -join ', ')"
}

Write-Host "All CI tests passed."
