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
    [string]$overRideParams,
    [string]$removeAdditionalFiles,
    [string]$excludeFilesFromAppData,
    [string]$takeAppOffline,
    [string]$additionalArguments
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

    if($removeAdditionalFiles -eq "false")
    {
        $msDeployCmdArgs = [string]::Format('{0} -enableRule:DoNotDeleteRule', $msDeployCmdArgs)
    }

    if($takeAppOffline -eq "true")
    {
        $msDeployCmdArgs = [string]::Format('{0} -enableRule:AppOffline', $msDeployCmdArgs)
    }

    if($excludeFilesFromAppData -eq "true")
    {
        $msDeployCmdArgs = [string]::Format('{0} -skip:Directory="\\App_Data"', $msDeployCmdArgs)
    }

    if(-not [string]::IsNullOrWhiteSpace($additionalArguments))
    {
        $msDeployCmdArgs = [string]::Format('{0} {1}', $msDeployCmdArgs, $additionalArguments)
    }
    
    $msDeployCmdArgs = [string]::Format(' -verb:sync -source:package="{0}" {1} -dest:auto -retryAttempts:3 -retryInterval:3000', $webDeployPackage, $msDeployCmdArgs)
    return $msDeployCmdArgs
}

function Deploy-Website
{    
    param(
        [string]$webDeployPkg,
        [string]$webDeployParamFile,
        [string]$overRiderParams,
        [string]$removeAdditionalFiles,
        [string]$excludeFilesFromAppData,
        [string]$takeAppOffline,
        [string]$additionalArguments
    )

    $msDeployExePath = Get-MsDeployLocation -regKeyPath $MsDeployInstallPathRegKey
    $msDeployCmdArgs = Get-MsDeployCmdArgs -webDeployPackage $webDeployPkg -webDeployParamFile $webDeployParamFile -overRideParams $overRiderParams -removeAdditionalFiles $removeAdditionalFiles -excludeFilesFromAppData $excludeFilesFromAppData -takeAppOffline $takeAppOffline -additionalArguments $additionalArguments

    $msDeployCmd = "`"$msDeployExePath`" $msDeployCmdArgs"
    Write-Verbose "Deploying website. Running command: $msDeployCmd"
    Run-Command -command $msDeployCmd
}

function Compute-MsDeploy-SetParams
{
    param(
        [string]$websiteName,
        [string]$overRideParams
    )

    Write-Verbose "Computing override params for msdeploy."

    if([string]::IsNullOrWhiteSpace($overRideParams))
    {
        Write-Verbose "Adding override params to ensure deployment happens on $websiteName"
        $overRideParams = [string]::Format('name="IIS Web Application Name",value="{0}"', $websiteName)
    }
    elseif(!$overRideParams.Contains("IIS Web Application Name")) 
    {
        Write-Verbose "Adding override params to ensure deployment happens on $websiteName"
        $overRideParams = $overRideParams + [string]::Format('{0}name="IIS Web Application Name",value="{1}"',  [System.Environment]::NewLine, $websiteName)
    }

    return $overRideParams
}

function Execute-Main
{
    param (
        [string]$WebDeployPackage,
        [string]$WebDeployParamFile,
        [string]$OverRideParams,
        [string]$WebsiteName,
        [string]$RemoveAdditionalFiles,
        [string]$ExcludeFilesFromAppData,
        [string]$TakeAppOffline,
        [string]$AdditionalArguments
        )

    Write-Verbose "Entering Execute-Main function"
    Write-Verbose "WebDeployPackage = $WebDeployPackage"
    Write-Verbose "WebDeployParamFile = $WebDeployParamFile"
    Write-Verbose "OverRideParams = $OverRideParams"
    Write-Verbose "WebsiteName = $WebsiteName"
    Write-Verbose "RemoveAdditionalFiles = $RemoveAdditionalFiles"
    Write-Verbose "ExcludeFilesFromAppData = $ExcludeFilesFromAppData"
    Write-Verbose "TakeAppOffline = $TakeAppOffline"
    Write-Verbose "AdditionalArguments = $AdditionalArguments"

    $overRideParams = Compute-MsDeploy-SetParams -websiteName $websiteName -overRideParams $overRideParams
    Deploy-Website -webDeployPkg $WebDeployPackage -webDeployParamFile $WebDeployParamFile -overRiderParams $OverRideParams -websiteName $websiteName -excludeFilesFromAppData $excludeFilesFromAppData -removeAdditionalFiles $removeAdditionalFiles -takeAppOffline $takeAppOffline -additionalArguments $AdditionalArguments
    Write-Verbose "Exiting Execute-Main function"
}