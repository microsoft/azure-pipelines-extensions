Import-Module Pester

Function Run-Tests()
{
    $scriptCwd = Split-Path -Parent $PSCommandPath
    $builtExtensionPath = Join-Path $scriptCwd "_build\Extensions"
    $resultsPath = Join-Path $scriptCwd "_build\TestResults"

    Write-verbose "Setting working directory as $builtExtensionPath" -verbose
    pushd $builtExtensionPath

    Write-Host "Cleaning test results folder: $resultsPath."
    if(-not (Test-Path -Path $resultsPath))
    {
        New-Item -Path $resultsPath -ItemType Directory -Force
    }
    Remove-Item -Path $resultsPath\* -Force -Recurse

    Write-Host "Running pester unit tests.."
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

Write-Verbose "InvokePester.ps1 started" -Verbose
Run-Tests
