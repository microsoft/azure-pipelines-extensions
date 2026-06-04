<#
.SYNOPSIS
  Publishes VSIX extensions to the marketplace.

.DESCRIPTION
  For each .vsix in the given directory, publishes it to the VS Marketplace
  using the version already embedded in the extension source code.

  When -ValidationOnly is provided, the script does not publish. It only
  polls Marketplace validation status for each extension version found in the
  provided VSIX files.

.PARAMETER VsixDirectory
  Directory containing .vsix files.

.PARAMETER MarketplaceToken
  PAT / access-token for VS Marketplace authentication.

.PARAMETER ValidationOnly
  If set, skip publish and only poll validation status.
#>
param(
    [Parameter(Mandatory)] [string] $VsixDirectory,
    [Parameter(Mandatory)] [string] $MarketplaceToken,
    [switch] $ValidationOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$validationRetryCount = 5
$initialValidationDelaySeconds = 15
$maxValidationDelaySeconds = 300

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
$vsixFiles = @(Get-ChildItem -Path $VsixDirectory -Filter '*.vsix')

if ($vsixFiles.Count -eq 0) {
    Write-Host "##[error]No .vsix files found in $VsixDirectory"
    exit 1
}

if ($ValidationOnly) {
    Write-Host "Found $($vsixFiles.Count) VSIX file(s) to validate:"
} else {
    Write-Host "Found $($vsixFiles.Count) VSIX file(s) to publish:"
}
$vsixFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

$failCount = 0
foreach ($vsix in $vsixFiles) {
    if ($ValidationOnly) {
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
    if ($ValidationOnly) {
        Write-Host "##[error]$failCount of $($vsixFiles.Count) extension(s) failed validation checks"
    } else {
        Write-Host "##[error]$failCount of $($vsixFiles.Count) extension(s) failed to publish"
    }
    exit 1
}

if ($ValidationOnly) {
    Write-Host "`nAll $($vsixFiles.Count) extension(s) validated successfully"
} else {
    Write-Host "`nAll $($vsixFiles.Count) extension(s) published successfully"
}
