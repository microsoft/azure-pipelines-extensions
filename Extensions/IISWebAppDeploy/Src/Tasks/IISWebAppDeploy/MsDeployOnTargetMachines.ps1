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
    $msDeployCmdArgs = Get-MsDeployCmdArgs -websiteName $websiteName -webDeployPackage $webDeployPkg -webDeployParamFile $webDeployParamFile -overRideParams $overRiderParams -removeAdditionalFiles $removeAdditionalFiles -excludeFilesFromAppData $excludeFilesFromAppData -takeAppOffline $takeAppOffline -isInputFolder $isInputFolder -isInputWebDeployPkg $isInputWebDeployPkg -additionalArguments $additionalArguments

    $msDeployCmd = "`"$msDeployExePath`" $msDeployCmdArgs"
    Write-Verbose "Deploying website. Running command: $msDeployCmd"
    Run-Command -command $msDeployCmd
}

function Create-ParamFileWithWebAppNameAttribute
{
    param(
        $paramFileXml,
        $websiteName
    )

    $iisAppNodeAttr = @{ "name"="IIS Web Application Name"; "defaultValue" = "$websiteName"; "tags" = "IisApp"}
    $iisAppChildNodeAttr = @{ "kind"="ProviderPath"; "scope" = "IisApp"; "tags" = "IisApp"}
    $aclChildNodeAttr = @{ "kind"="ProviderPath"; "scope" = "setAcl"}

    $iisAppNode = Create-ChildNodeWithAttributes -xmlDom $paramFileXml -name "parameter" -attributes $iisAppNodeAttr
    $iisAppChildNode = Create-ChildNodeWithAttributes -xmlDom $paramFileXml -name "parameterEntry" -attributes $iisAppChildNodeAttr
    $aclChildNode = Create-ChildNodeWithAttributes -xmlDom $paramFileXml -name "parameterEntry" -attributes $aclChildNodeAttr
    
    $iisAppNode.AppendChild($iisAppChildNode) | Out-null
    $iisAppNode.AppendChild($aclChildNode) | Out-null
    $parameters = $paramFileXml.output.parameters
    $parameters.AppendChild($iisAppNode) | Out-Null
    $paramFileXml.removeChild($paramFileXml.output) | Out-null
    $paramFileXml.AppendChild($parameters) | Out-null

    $declareParamFile = [string]::Format("{0}{1}", [System.IO.Path]::GetTempPath(), "temp_parameters.xml");
    $paramFileXml.save($declareParamFile)
    Write-Verbose "Declare parameters.xml file is being created at path : $declareParamFile"
    return $declareParamFile

}

function Create-ChildNodeWithAttributes
{
    param(
        $xmlDom,
        $name,
        $attributes
    )

    $childNode = $xmlDom.CreateElement($name)
    $attributes.Keys | % { $childNode.SetAttribute($_, $attributes.Item($_)) }
    return $childNode
}

function Update-PkgWithParamFile
{
    param(
        [String][Parameter(Mandatory=$true)] $webDeployPackage,
        [String][Parameter(Mandatory=$true)] $declareParamFile
    )

    $updatedWebDeployPkg = [string]::Format("{0}{1}", [System.IO.Path]::GetTempPath(), "temp_webapp_package.zip");
    $msDeployExePath = Get-MsDeployLocation -regKeyPath $MsDeployInstallPathRegKey
    $msDeployDeclareParamFileCmdArgs = '-verb:sync -source:package="' + $webDeployPackage +'" -dest:package="' + $updatedWebDeployPkg + '" -enableRule:DoNotDeleteRule -declareParamFile:"' + $declareParamFile + '"' 
    $msDeployDeclareParamFileCmd = "`"$msDeployExePath`" $msDeployDeclareParamFileCmdArgs"
    Write-Verbose "Running msDeploy command to update parameters.xml file in package."
    Write-Verbose "##[command]$msDeployDeclareParamFileCmd"
    $result = Run-Command -command $msDeployDeclareParamFileCmd
    return $updatedWebDeployPkg
}

function Is-Directory
{
    param(
        [String][Parameter(Mandatory=$true)] $Path
    )

    if(-not (Test-Path -Path $Path))
    {
        throw "$packageFile doesn't exists."
    }
    if((Get-Item $Path) -is [System.IO.DirectoryInfo])
    {
        return $true
    }
    return $false
}

function Get-ParamFileXml
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
        return $paramFileXML  
    }
    Write-Verbose "Parameters.xml file is not present in package."   
    return $null
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

function Process-WebDeployPackage
{
    param (
        [string]$WebDeployPackage
        )

    $paramFileXml = Get-ParamFileXml -packageFile $WebDeployPackage
    $isInputWebDeployPkg = $false
    $updatedWebDeployPkg = $WebDeployPackage

    if($paramFileXml -ne $null)
    {
        $isInputWebDeployPkg = $true
        $parameters = $paramFileXML.output.parameters
        $iisWebAppParam = $parameters.parameter | Where-Object { $_.name -eq 'IIS Web Application Name'}

        if(-not $iisWebAppParam)
        {
            $declareParamFile = Create-ParamFileWithWebAppNameAttribute -paramFileXml $paramFileXml -websiteName $websiteName
            $updatedWebDeployPkg = Update-PkgWithParamFile -webDeployPackage $WebDeployPackage -declareParamFile $declareParamFile
        }
    }

    return $updatedWebDeployPkg, $isInputWebDeployPkg
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
        $WebDeployPackage, $isInputWebDeployPkg = Process-WebDeployPackage -WebDeployPackage $WebDeployPackage
    }

    Deploy-Website -websiteName $websiteName -webDeployPkg $WebDeployPackage -webDeployParamFile $WebDeployParamFile -overRiderParams $OverRideParams -excludeFilesFromAppData $excludeFilesFromAppData -removeAdditionalFiles $removeAdditionalFiles -takeAppOffline $takeAppOffline -isInputFolder $isInputFolder -isInputWebDeployPkg $isInputWebDeployPkg -additionalArguments $AdditionalArguments
    Write-Verbose "Exiting Execute-Main function"
}

