﻿Write-Verbose "Entering script MsDeployOnTargetMachines.ps1"
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
    
    $msDeployNotFoundError = "Cannot find MsDeploy.exe location. Verify MsDeploy.exe is installed on $env:ComputerName and try operation again."

    if( -not (Test-Path -Path $regKeyPath))
    {
        throw $msDeployNotFoundError 
    }

    $path = (Get-ChildItem -Path $regKeyPath | Select -Last 1).GetValue("InstallPath")

    if($path -eq $null)
    {
        throw $msDeployNotFoundError
    }

    if( -not (Test-Path -Path $path))
    {
        throw $msDeployNotFoundError
    }

    Write-Verbose "MsDeploy Install location: $path"
    return (Join-Path $path msDeploy.exe)
}

function Get-MsDeployCmdArgs
{
    param(
    [Parameter(Mandatory=$true)]
    [string]$websiteName,
    [Parameter(Mandatory=$true)]
    [string]$webDeployPackage,
    [string]$webDeployParamFile,
    [string]$overRideParams,
    [string]$removeAdditionalFiles,
    [string]$excludeFilesFromAppData,
    [string]$takeAppOffline,
    [Boolean]$isInputFolder,
    [Boolean]$isInputWebDeployPkg,
    [string]$additionalArguments
    )

    if(-not ( Test-Path -Path $webDeployPackage))
    {
        throw "Package does not exist : `"$webDeployPackage`""
    }

    $msDeployCmdArgs = [String]::Format(" -verb:sync")

    if($isInputFolder)
    {
        $msDeployCmdArgs += [String]::Format(' -source:iisApp="{0}"', $webDeployPackage);
        $msDeployCmdArgs += [String]::Format(' -dest:iisApp="{0}"', $websiteName);
    }
    else
    {
        $msDeployCmdArgs += [String]::Format(' -source:package="{0}"', $webDeployPackage);
        if($isInputWebDeployPkg)
        {
            $msDeployCmdArgs += [String]::Format(' -dest:auto');
        }
        else {
            $msDeployCmdArgs += [String]::Format(' -dest:contentPath="{0}",', $websiteName);
        }
    }

    if(-not [string]::IsNullOrWhiteSpace($webDeployParamFile))
    {   
    
        if(-not ( Test-Path -Path $webDeployParamFile))
        {
            throw "Param file does not exist : `"$webDeployParamFile`""
        }

        $msDeployCmdArgs += [string]::Format(' -setParamFile="{0}"', $webDeployParamFile)
    }

    if($isInputWebDeployPkg) {
         $overRideParams = Compute-MsDeploy-SetParams -websiteName $websiteName -overRideParams $overRideParams
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

    $msDeployCmdArgs = [string]::Format('{0} -retryAttempts:3 -retryInterval:3000', $msDeployCmdArgs)
    Write-Verbose "MsDeploy command line arguments: $msDeployCmdArgs"
    return $msDeployCmdArgs
}

function Deploy-Website
{    
    param(
        [string]$websiteName,
        [string]$webDeployPkg,
        [string]$webDeployParamFile,
        [string]$overRideParams,
        [string]$removeAdditionalFiles,
        [string]$excludeFilesFromAppData,
        [string]$takeAppOffline,
        [string]$additionalArguments,
        [Boolean]$isInputFolder,
        [Boolean]$isInputWebDeployPkg
    )

    $msDeployExePath = Get-MsDeployLocation -regKeyPath $MsDeployInstallPathRegKey
    $msDeployCmdArgs = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPkg -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams -removeAdditionalFiles $removeAdditionalFiles -excludeFilesFromAppData $excludeFilesFromAppData -takeAppOffline $takeAppOffline -isInputFolder $isInputFolder -isInputWebDeployPkg $isInputWebDeployPkg -additionalArguments $additionalArguments

    $msDeployCmd = "`"$msDeployExePath`" $msDeployCmdArgs"
    Write-Verbose "Deploying website. Running command: $msDeployCmd"
    Run-Command -command $msDeployCmd
}

function Is-Directory
{
    param(
        [String][Parameter(Mandatory=$true)] $Path
    )

    if(-not (Test-Path -Path $Path))
    {
        throw "$Path doesn't exists."
    }
    if((Get-Item $Path) -is [System.IO.DirectoryInfo])
    {
        return $true
    }
    return $false
}

function Contains-ParamFile
{
    param(
        [String][Parameter(Mandatory=$true)] $packageFile
    )

    $msDeployExePath = Get-MsDeployLocation -regKeyPath $MsDeployInstallPathRegKey
    $msDeployCheckParamFileCmdArgs = " -verb:getParameters -source:package='" + $packageFile + "'";
    $msDeployCheckParamFileCmd = "`"$msDeployExePath`" $msDeployCheckParamFileCmdArgs"
    Write-Verbose "Running msDeploy command to check if $packageFile contains paramters file."
    Write-Verbose "##[command]$msDeployCheckParamFileCmd"
    $ParamFileContent = Run-Command -command $msDeployCheckParamFileCmd
    $paramFileXML = [XML] $ParamFileContent
    if($paramFileXML.output.parameters)
    {
        Write-Verbose "Parameters.xml file is present in package."
        return $true 
    }
    Write-Verbose "Parameters.xml file is not present in package."   
    return $false
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

    # Check if package contains parameter.xml file
    $isInputFolder = Is-Directory -Path $WebDeployPackage
    $isInputWebDeployPkg = $false
    if(-not $isInputFolder)
    {
        $isInputWebDeployPkg = Contains-ParamFile -packageFile $WebDeployPackage
    }

    Deploy-Website -websiteName $websiteName -webDeployPkg $WebDeployPackage -webDeployParamFile $WebDeployParamFile -overRideParams $OverRideParams -excludeFilesFromAppData $excludeFilesFromAppData -removeAdditionalFiles $removeAdditionalFiles -takeAppOffline $takeAppOffline -isInputFolder $isInputFolder -isInputWebDeployPkg $isInputWebDeployPkg -additionalArguments $AdditionalArguments
    Write-Verbose "Exiting Execute-Main function"
}
