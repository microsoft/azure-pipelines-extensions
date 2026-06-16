<#
.SYNOPSIS
  Publishes VSIX extensions to the marketplace, with an optional rescue mode for slow Marketplace validation.

.DESCRIPTION
  Default (publish) mode
    For each .vsix in the given directory, publishes it to the VS Marketplace using the version already
    embedded in the extension source code. If `tfx extension publish` exits non-zero with output that
    indicates Marketplace validation is still running, falls back to polling validation status.

  RescueFailedPublish mode (-RescueFailedPublish -PublishTaskDisplayName <name>)
    Intended to run after a separate publish task (for example 1ES.PublishAzureDevOpsExtension@1) fails
    with continueOnError. Reads that task's log via the Azure DevOps REST API and only polls Marketplace
    validation when the log contains a long-validation timeout indicator. For any other failure (duplicate
    version, auth issue, malformed package, etc.) the script exits 1 and echoes the tail of the publish
    task log so the real error is not masked by a misleading "validation timed out" rescue.

    Requires the following environment variables (Azure Pipelines provides them; SYSTEM_ACCESSTOKEN must
    be mapped explicitly via the task's `env:` block):
      - SYSTEM_ACCESSTOKEN
      - SYSTEM_COLLECTIONURI
      - SYSTEM_TEAMPROJECT
      - BUILD_BUILDID

.PARAMETER VsixDirectory
  Directory containing .vsix files.

.PARAMETER MarketplaceToken
  PAT / access-token for VS Marketplace authentication.

.PARAMETER RescueFailedPublish
  If set, inspect the log of the publish task named by -PublishTaskDisplayName and only poll Marketplace
  validation when the log indicates a long-validation timeout. Otherwise exit 1.

.PARAMETER PublishTaskDisplayName
  The `displayName` of the publish task to inspect (required with -RescueFailedPublish).
#>
param(
    [Parameter(Mandatory)] [string] $VsixDirectory,
    [Parameter(Mandatory)] [string] $MarketplaceToken,
    [switch] $RescueFailedPublish,
    [string] $PublishTaskDisplayName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($RescueFailedPublish -and [string]::IsNullOrWhiteSpace($PublishTaskDisplayName)) {
    Write-Host "##[error]-RescueFailedPublish requires -PublishTaskDisplayName"
    exit 1
}

$validationRetryCount = 5
$initialValidationDelaySeconds = 15
$maxValidationDelaySeconds = 300

# Strings emitted by tfx-cli (and the 1ES publish task that wraps it) when Marketplace validation is
# still running after the publish call has timed out. Any other failure should be treated as a real
# error, not a candidate for the validation-polling rescue path.
$longValidationPatterns = @(
    'Validation is taking much longer than usual',
    'This extension will be available after validation is successful'
)

function Invoke-TfxCommand {
    param(
        [Parameter(Mandatory)] [string[]] $Arguments
    )

    $output = & tfx @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $outputText = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine

    return [PSCustomObject]@{
        ExitCode = $exitCode
        Output   = $outputText
    }
}

function Get-ValidationMetadata {
    param(
        [Parameter(Mandatory)] [string] $VsixName,
        [string] $PublishOutput = ''
    )

    if ($PublishOutput) {
        $fromOutput = [regex]::Match(
            $PublishOutput,
            'tfx extension isvalid --publisher (?<publisher>\S+) --extension-id (?<extensionId>\S+) --version (?<version>\S+)',
            [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
        )

        if ($fromOutput.Success) {
            return [PSCustomObject]@{
                Publisher   = $fromOutput.Groups['publisher'].Value
                ExtensionId = $fromOutput.Groups['extensionId'].Value
                Version     = $fromOutput.Groups['version'].Value
            }
        }
    }

    $fromFileName = [regex]::Match(
        $VsixName,
        '^(?<publisher>[^.]+)\.(?<extensionId>.+)-(?<version>\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\.vsix$',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    if ($fromFileName.Success) {
        return [PSCustomObject]@{
            Publisher   = $fromFileName.Groups['publisher'].Value
            ExtensionId = $fromFileName.Groups['extensionId'].Value
            Version     = $fromFileName.Groups['version'].Value
        }
    }

    return $null
}

function Get-FailedPublishTaskLog {
    param(
        [Parameter(Mandatory)] [string] $TaskDisplayName
    )

    $required = @{
        SYSTEM_ACCESSTOKEN   = $env:SYSTEM_ACCESSTOKEN
        SYSTEM_COLLECTIONURI = $env:SYSTEM_COLLECTIONURI
        SYSTEM_TEAMPROJECT   = $env:SYSTEM_TEAMPROJECT
        BUILD_BUILDID        = $env:BUILD_BUILDID
    }
    foreach ($entry in $required.GetEnumerator()) {
        if ([string]::IsNullOrWhiteSpace($entry.Value)) {
            Write-Host "##[error]Required environment variable $($entry.Key) is not set"
            return $null
        }
    }

    $headers = @{
        Authorization = "Bearer $($required.SYSTEM_ACCESSTOKEN)"
        Accept        = 'application/json'
    }

    $collectionUri = $required.SYSTEM_COLLECTIONURI.TrimEnd('/')
    $timelineUrl = "$collectionUri/$($required.SYSTEM_TEAMPROJECT)/_apis/build/builds/$($required.BUILD_BUILDID)/timeline?api-version=7.0"

    $taskRecord = $null
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            $timeline = Invoke-RestMethod -Uri $timelineUrl -Headers $headers -Method Get
            $taskRecord = $timeline.records |
                Where-Object { $_.type -eq 'Task' -and $_.name -eq $TaskDisplayName -and $_.log -and $_.log.url } |
                Sort-Object -Property finishTime -Descending |
                Select-Object -First 1

            if ($taskRecord) { break }
        } catch {
            Write-Host "Attempt $attempt`: failed to fetch build timeline ($($_.Exception.Message))"
        }

        if ($attempt -lt 3) {
            Start-Sleep -Seconds 5
        }
    }

    if (-not $taskRecord) {
        Write-Host "##[error]Could not find a finished task record named '$TaskDisplayName' with an uploaded log"
        return $null
    }

    try {
        $logResponse = Invoke-WebRequest -Uri $taskRecord.log.url -Headers $headers -Method Get -UseBasicParsing
        return $logResponse.Content
    } catch {
        Write-Host "##[error]Failed to download log for task '$TaskDisplayName': $($_.Exception.Message)"
        return $null
    }
}

function Test-LogIndicatesLongValidation {
    param([string] $LogContent)

    if ([string]::IsNullOrEmpty($LogContent)) { return $false }
    foreach ($pattern in $longValidationPatterns) {
        if ($LogContent.IndexOf($pattern, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return $true
        }
    }
    return $false
}

function Write-PublishLogTail {
    param(
        [string] $LogContent,
        [int] $LineCount = 40
    )

    if ([string]::IsNullOrEmpty($LogContent)) { return }
    $tail = ($LogContent -split "`r?`n" | Select-Object -Last $LineCount) -join [Environment]::NewLine
    Write-Host "----- Tail of publish task log (last $LineCount lines) -----"
    Write-Host $tail
    Write-Host "----- End of publish task log tail -----"
}

function Wait-ForMarketplaceValidation {
    param(
        [Parameter(Mandatory)] [string] $Publisher,
        [Parameter(Mandatory)] [string] $ExtensionId,
        [Parameter(Mandatory)] [string] $Version,
        [Parameter(Mandatory)] [string] $Token,
        [Parameter(Mandatory)] [int] $RetryCount,
        [Parameter(Mandatory)] [int] $InitialDelaySeconds,
        [Parameter(Mandatory)] [int] $MaxDelaySeconds
    )

    $delaySeconds = $InitialDelaySeconds

    for ($attempt = 1; $attempt -le $RetryCount; $attempt++) {
        Write-Host "Checking validation status (attempt $attempt/$RetryCount): $Publisher.$ExtensionId $Version"

        $validationResult = Invoke-TfxCommand -Arguments @(
            'extension',
            'isvalid',
            '--publisher', $Publisher,
            '--extension-id', $ExtensionId,
            '--version', $Version,
            '--service-url', 'https://marketplace.visualstudio.com',
            '--token', $Token,
            '--no-color'
        )

        if ($validationResult.ExitCode -eq 0) {
            Write-Host "Validation completed successfully for $Publisher.$ExtensionId $Version"
            return $true
        }

        if ($attempt -lt $RetryCount) {
            $currentDelay = [Math]::Min($delaySeconds, $MaxDelaySeconds)
            Write-Host "Validation not ready yet. Waiting $currentDelay second(s) before retry."
            Start-Sleep -Seconds $currentDelay
            $delaySeconds = [Math]::Min($delaySeconds * 2, $MaxDelaySeconds)
        }
    }

    return $false
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
$pollOnly = $false

if ($RescueFailedPublish) {
    Write-Host "Inspecting log of failed publish task '$PublishTaskDisplayName' to decide whether to poll Marketplace validation..."

    $publishLog = Get-FailedPublishTaskLog -TaskDisplayName $PublishTaskDisplayName
    if ($null -eq $publishLog) {
        Write-Host "##[error]Could not retrieve publish task log; failing rescue to avoid masking the real error."
        exit 1
    }

    if (-not (Test-LogIndicatesLongValidation -LogContent $publishLog)) {
        Write-Host "##[error]Marketplace validation mode was invoked, but the log for task '$PublishTaskDisplayName' does not contain messages that indicate inability to verify status of an extension upload."
        Write-Host "Two possibilities to investigate:"
        Write-Host "  1. The publish task failed for an unrelated reason (for example: version already published, authentication failure, malformed package, etc.). The actual error should appear in the publish task log."
        Write-Host "  2. The publish actually succeeded but emitted warnings that promoted its status to SucceededWithIssues, which falsely triggered this mode. In that case verify the extension's status on Marketplace directly - it may already be published correctly."
        Write-PublishLogTail -LogContent $publishLog
        exit 1
    }

    Write-Host "Publish task log indicates a long-validation timeout. Polling Marketplace validation status..."
    $pollOnly = $true
}

$vsixFiles = @(Get-ChildItem -Path $VsixDirectory -Filter '*.vsix')

if ($vsixFiles.Count -eq 0) {
    Write-Host "##[error]No .vsix files found in $VsixDirectory"
    exit 1
}

if ($pollOnly) {
    Write-Host "Found $($vsixFiles.Count) VSIX file(s) to validate:"
} else {
    Write-Host "Found $($vsixFiles.Count) VSIX file(s) to publish:"
}
$vsixFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

$failCount = 0
foreach ($vsix in $vsixFiles) {
    if ($pollOnly) {
        Write-Host "`nValidating: $($vsix.Name)..."

        $metadata = Get-ValidationMetadata -VsixName $vsix.Name
        if (-not $metadata) {
            Write-Host "##[error]Failed to parse validation metadata from $($vsix.Name)."
            $failCount++
            continue
        }

        $validationSucceeded = Wait-ForMarketplaceValidation `
            -Publisher $metadata.Publisher `
            -ExtensionId $metadata.ExtensionId `
            -Version $metadata.Version `
            -Token $MarketplaceToken `
            -RetryCount $validationRetryCount `
            -InitialDelaySeconds $initialValidationDelaySeconds `
            -MaxDelaySeconds $maxValidationDelaySeconds

        if ($validationSucceeded) {
            Write-Host "Validation confirmed: $($vsix.Name)"
        } else {
            Write-Host "##[error]Failed to validate extension within retry window for $($vsix.Name)"
            $failCount++
        }

        continue
    }

    Write-Host "`nPublishing: $($vsix.Name)..."

    $publishResult = Invoke-TfxCommand -Arguments @(
        'extension',
        'publish',
        '--vsix', $vsix.FullName,
        '--service-url', 'https://marketplace.visualstudio.com',
        '--auth-type', 'pat',
        '--token', $MarketplaceToken,
        '--no-color'
    )

    if ($publishResult.ExitCode -eq 0) {
        Write-Host "Published: $($vsix.Name)"
        continue
    }

    $isLongValidationTimeout =
        $publishResult.Output -match 'Validation is taking much longer than usual' -or
        $publishResult.Output -match 'This extension will be available after validation is successful'

    if (-not $isLongValidationTimeout) {
        Write-Host "##[error]Failed to publish $($vsix.Name)"
        $failCount++
        continue
    }

    Write-Host "Publish command timed out while waiting for validation for $($vsix.Name). Polling validation status with retry."

    $metadata = Get-ValidationMetadata -VsixName $vsix.Name -PublishOutput $publishResult.Output
    if (-not $metadata) {
        Write-Host "##[error]Failed to parse validation metadata for $($vsix.Name)."
        Write-Host "##[error]Original tfx output:"
        Write-Host $publishResult.Output
        $failCount++
        continue
    }

    $validationSucceeded = Wait-ForMarketplaceValidation `
        -Publisher $metadata.Publisher `
        -ExtensionId $metadata.ExtensionId `
        -Version $metadata.Version `
        -Token $MarketplaceToken `
        -RetryCount $validationRetryCount `
        -InitialDelaySeconds $initialValidationDelaySeconds `
        -MaxDelaySeconds $maxValidationDelaySeconds

    if ($validationSucceeded) {
        Write-Host "Published and validated: $($vsix.Name)"
    } else {
        Write-Host "##[error]Failed to validate published extension within retry window for $($vsix.Name)"
        $failCount++
    }
}

if ($failCount -gt 0) {
    if ($pollOnly) {
        Write-Host "##[error]$failCount of $($vsixFiles.Count) extension(s) failed validation checks"
    } else {
        Write-Host "##[error]$failCount of $($vsixFiles.Count) extension(s) failed to publish"
    }
    exit 1
}

if ($pollOnly) {
    Write-Host "`nAll $($vsixFiles.Count) extension(s) validated successfully"
} else {
    Write-Host "`nAll $($vsixFiles.Count) extension(s) published successfully"
}
