Import-Module Pester

Function Run-Tests()
{
    param(
        [string]$modulePath
    )

    $scriptCwd = Split-Path -Parent $PSCommandPath
    $taskSrcPath = Join-Path $scriptCwd "_build\Extensions\$modulePath\Src"
    $taskTestPath = Join-Path $scriptCwd "_build\Extensions\$modulePath\Tests"
    $resultsPath = Join-Path $scriptCwd "_build\Extensions\$modulePath\TestResults"

    pushd $taskTestPath

    Write-Host "Cleaning test results folder: $resultsPath."
    if(-not (Test-Path -Path $resultsPath))
    {
        New-Item -Path $resultsPath -ItemType Directory -Force
    }
    Remove-Item -Path $resultsPath\* -Force -Recurse

    Write-Host "Running unit tests.."
    $resultsFile = Join-Path $resultsPath "Results.xml"    
    $result = Invoke-Pester -OutputFile $resultsFile -OutputFormat NUnitXml -PassThru


    <# TODO : subraman removing code coverage as of now
    $result = Invoke-Pester -OutputFile $resultsFile -OutputFormat NUnitXml -PassThru  -CodeCoverage @{Path = $taskSrcPath + '**\*.ps1'}
    $codeCoveragePercentage =  ( $result.CodeCoverage.NumberOfCommandsExecuted * 100 ) / $result.CodeCoverage.NumberOfCommandsAnalyzed

    if($codeCoveragePercentage -lt 95)
    {
        throw "Code coverage goal (95%) not met, current coverage ($codeCoveragePercentage%)."
    }
    #>

    if($result.FailedCount -ne 0)
    {
        throw "One or more unit tests failed, please check logs for further details."
    }
    
    popd
    Write-Host "Completed execution of units."
}

# Run tests for all extensions.
# Get folder names under _build folder
$modulePaths = @()

Get-ChildItem -Directory -Path .\_build\Extensions -Exclude "Common" | Select Name | %{ $modulePaths += $_.Name }
Get-ChildItem -Directory -Path .\_build\Extensions\Common | Select Name | %{ Join-Path -Path "Common" -ChildPath $_.Name } | %{ $modulePaths += $_}

foreach($modulePath in $modulePaths)
{        
    Write-Verbose "Running tests under $modulePath" -Verbose
    Run-Tests -modulePath $modulePath    
}
