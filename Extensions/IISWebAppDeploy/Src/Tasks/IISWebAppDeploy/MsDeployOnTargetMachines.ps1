Write-Verbose "Entering script MsDeployOnTargetMachines.ps1"
$MsDeployInstallPathRegKey = "HKLM:\SOFTWARE\Microsoft\IIS Extensions\MSDeploy"

function Run-Command
{
    param(
        [string]$command,
        [bool] $failOnErr = $true
    )

    $ErrorActionPreference = 'Continue'

    if( $psversiontable.PSVersion.Major -le 4)
    {        
        $result = cmd.exe /c "`"$command`""
    }
    else
    {
        $result = cmd.exe /c "$command"
    }
    
    $ErrorActionPreference = 'Stop'

    if($failOnErr -and $LASTEXITCODE -ne 0)
    {
        throw $result
    }
    
    return $result
}

function Get-MsDeployLocation
{
    param(
    [Parameter(Mandatory=$true)]
    [string]$regKeyPath
    )

    $msDeployNotFoundError = "Cannot find MsDeploy.exe location. Verify MsDeploy.exe is installed on $env:ComputeName and try operation again."
    
    if( -not (Test-Path -Path $regKeyPath))
    {
        throw $msDeployNotFoundError 
    }
        
    $path = (Get-ChildItem -Path $regKeyPath | Select -Last 1).GetValue("InstallPath")

    if( -not (Test-Path -Path $path))
    {
        throw $msDeployNotFoundError 
    }

    return (Join-Path $path msDeploy.exe)
}

function Get-MsDeployCmdArgs
{
    param(
    [Parameter(Mandatory=$true)]
    [string]$webDeployPackage,
    [string]$webDeployParamFile,
    [string]$overRideParams
    )

    if(-not ( Test-Path -Path $webDeployPackage))
    {
        throw "Package does not exist : `"$webDeployPackage`""
    }

    $msDeployCmdArgs = [string]::Empty
    if(-not [string]::IsNullOrWhiteSpace($webDeployParamFile))
    {   
    
        if(-not ( Test-Path -Path $webDeployParamFile))
        {
            throw "Param file does not exist : `"$webDeployParamFile`""
        }

        $msDeployCmdArgs = [string]::Format(' -setParamFile="{0}"', $webDeployParamFile)
    }
    
    $setParams = $overRideParams.Split([System.Environment]::NewLine, [System.StringSplitOptions]::RemoveEmptyEntries)
    foreach($setParam in $setParams)
    {
        $setParam = $setParam.Trim()
        if(-not [string]::IsNullOrWhiteSpace($setParam))
        {
            $msDeployCmdArgs = [string]::Format('{0} -setParam:{1}', $msDeployCmdArgs, $setParam)
        }
    }
    
    $msDeployCmdArgs = [string]::Format(' -verb:sync -source:package="{0}" {1} -dest:auto -retryAttempts:3 -retryInterval:3000', $webDeployPackage, $msDeployCmdArgs)
    return $msDeployCmdArgs
}

function Deploy-Website
{    
    param(
        [string]$webDeployPkg,
        [string]$webDeployParamFile,
        [string]$overRiderParams
    )

    $msDeployExePath = Get-MsDeployLocation -regKeyPath $MsDeployInstallPathRegKey
    $msDeployCmdArgs = Get-MsDeployCmdArgs -webDeployPackage $webDeployPkg -webDeployParamFile $webDeployParamFile -overRideParams $overRiderParams

    $msDeployCmd = "`"$msDeployExePath`" $msDeployCmdArgs"
    Write-Verbose "Deploying website. Running command: $msDeployCmd"
    Run-Command -command $msDeployCmd
}

function Execute-Main
{
    param (
        [string]$WebDeployPackage,
        [string]$WebDeployParamFile,
        [string]$OverRideParams
        )

    Write-Verbose "Entering Execute-Main function"
    Write-Verbose "WebDeployPackage = $WebDeployPackage"
    Write-Verbose "WebDeployParamFile = $WebDeployParamFile"
    Write-Verbose "OverRideParams = $OverRideParams"

    Deploy-Website -webDeployPkg $WebDeployPackage -webDeployParamFile $WebDeployParamFile -overRiderParams $OverRideParams
    Write-Verbose "Exiting Execute-Main function"
}

# just test validation pr
