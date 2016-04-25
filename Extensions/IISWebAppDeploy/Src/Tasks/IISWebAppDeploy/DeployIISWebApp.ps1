import-module "Microsoft.TeamFoundation.DistributedTask.Task.Internal"
import-module "Microsoft.TeamFoundation.DistributedTask.Task.Common"
import-module "Microsoft.TeamFoundation.DistributedTask.Task.DevTestLabs"
Import-Module "Microsoft.TeamFoundation.DistributedTask.Task.Deployment.Internal"


Import-Module .\InvokeRemoteDeployment.ps1

Write-Verbose "Entering script DeployIISWebApp.ps1"

function Trim-Inputs([ref]$package, [ref]$paramFile, [ref]$siteName, [ref]$adminUser)
{
    Write-Verbose "Triming inputs for excess spaces, double quotes"

    $package.Value = $package.Value.Trim('"', ' ')
    $paramFile.Value = $paramFile.Value.Trim('"', ' ')
    $siteName.Value = $siteName.Value.Trim('"', ' ')

    $adminUser.Value = $adminUser.Value.Trim()
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

function Escape-DoubleQuotes
{
    param(
        [string]$str
    )

    return $str.Replace('"', '`"')
}

function Get-ScriptToRun
{
    param (
        [string]$webDeployPackage,
        [string]$webDeployParamFile,
        [string]$overRideParams
    )

    $msDeployScript = Get-Content  ./MsDeployOnTargetMachines.ps1 | Out-String
    $invokeMain = "Execute-Main -WebDeployPackage `"$webDeployPackage`" -WebDeployParamFile `"$webDeployParamFile`" -OverRideParams `"$overRideParams`""

    Write-Verbose "Executing main funnction in MsDeployOnTargetMachines : $invokeMain"
    $msDeployOnTargetMachinesScript = [string]::Format("{0} {1} ( {2} )", $msDeployScript,  [Environment]::NewLine,  $invokeMain)
    return $msDeployOnTargetMachinesScript
}

function Run-RemoteDeployment
{
    param(
        [string]$machinesList,
        [string]$scriptToRun,
        [string]$adminUserName,
        [string]$adminPassword,
        [string]$winrmProtocol,
        [string]$testCertificate,
        [string]$deployInParallel
    )

    Write-Host "Starting deployment of IIS Web Deploy Package :", $webDeployPackage

    $errorMessage = Invoke-RemoteDeployment -machinesList $machinesList -scriptToRun $scriptToRun -adminUserName $adminUserName -adminPassword $adminPassword -protocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel

    if(-not [string]::IsNullOrEmpty($errorMessage))
    {
        $helpMessage = "For more info please refer to http://aka.ms/iisextnreadme)"
        throw "$errorMessage $helpMessage"
    }

    Write-Host "Successfully deployed IIS Web Deploy Package :" , $webDeployPackage
}

function Main
{
    param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [string]$webDeployPackage,
    [string]$webDeployParamFile,
    [string]$overRideParams,
    [string]$websiteName,
    [string]$deployInParallel
    )

    Write-Verbose "machinesList = $machinesList"
    Write-Verbose "adminUserName = $adminUserName"
    Write-Verbose "winrmProtocol  = $winrmProtocol"
    Write-Verbose "testCertificate = $testCertificate"
    Write-Verbose "webDeployPackage = $webDeployPackage"
    Write-Verbose "webDeployParamFile = $webDeployParamFile"
    Write-Verbose "overRideParams = $overRideParams"
    Write-Verbose "websiteName = $websiteName"
    Write-Verbose "deployInParallel = $deployInParallel"

    Trim-Inputs -package ([ref]$webDeployPackage) -paramFile ([ref]$webDeployParamFile) -siteName ([ref]$websiteName) -adminUser ([ref]$adminUserName)
    $overRideParams = Compute-MsDeploy-SetParams -websiteName $websiteName -overRideParams $overRideParams
    $overRideParams = Escape-DoubleQuotes -str $overRideParams
    $script = Get-ScriptToRun -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams
    Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel
}