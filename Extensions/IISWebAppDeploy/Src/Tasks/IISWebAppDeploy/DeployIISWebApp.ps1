Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\InvokeRemoteDeployment.ps1

Write-Verbose "Entering script DeployIISWebApp.ps1"

function Trim-Inputs([ref]$package, [ref]$paramFile, [ref]$siteName, [ref]$adminUser)
{
    Write-Verbose "Triming inputs for excess spaces, double quotes"

    $package.Value = $package.Value.Trim('"', ' ')
    $paramFile.Value = $paramFile.Value.Trim('"', ' ')
    $siteName.Value = $siteName.Value.Trim('"', ' ')

    $adminUser.Value = $adminUser.Value.Trim()
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
        [string]$overRideParams,
        [string]$websiteName,
        [string]$removeAdditionalFiles,
        [string]$excludeFilesFromAppData,        
        [string]$takeAppOffline,
        [string]$additionalArguments
    )

    $msDeployScript = Get-Content  ./MsDeployOnTargetMachines.ps1 | Out-String
    $overRideParams = Escape-DoubleQuotes -str $overRideParams
    $websiteName = Escape-DoubleQuotes -str $websiteName

    $invokeMain = "Execute-Main -WebDeployPackage `"$webDeployPackage`" -WebDeployParamFile `"$webDeployParamFile`" -OverRideParams `"$overRideParams`" -WebsiteName $websiteName -RemoveAdditionalFiles $removeAdditionalFiles -ExcludeFilesFromAppData $excludeFilesFromAppData -TakeAppOffline $takeAppOffline -AdditionalArguments `"$AdditionalArguments`""

    Write-Verbose "Executing main function in MsDeployOnTargetMachines : $invokeMain"
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
        [string]$deployInParallel,
        [string]$webDeployPackage
    )

    Write-Host "Starting deployment of IIS Web Deploy Package : $webDeployPackage"

    $errorMessage = Invoke-RemoteDeployment -machinesList $machinesList -scriptToRun $scriptToRun -adminUserName $adminUserName -adminPassword $adminPassword -protocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel

    if(-not [string]::IsNullOrEmpty($errorMessage))
    {
        $helpMessage = "For more info please refer to http://aka.ms/iisextnreadme"
        Write-Error "$errorMessage`n$helpMessage"
        return
    }

    Write-Host "Successfully deployed IIS Web Deploy Package : $webDeployPackage"
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
    [string]$removeAdditionalFiles,
    [string]$excludeFilesFromAppData,
    [string]$takeAppOffline,
    [string]$additionalArguments,
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
    Write-Verbose "removeAdditionalFiles = $removeAdditionalFiles"
    Write-Verbose "excludeFilesFromAppData = $excludeFilesFromAppData"
    Write-Verbose "takeAppOffline = $takeAppOffline"
    Write-Verbose "additionalArguments = $additionalArguments"
    Write-Verbose "deployInParallel = $deployInParallel"

    Trim-Inputs -package ([ref]$webDeployPackage) -paramFile ([ref]$webDeployParamFile) -siteName ([ref]$websiteName) -adminUser ([ref]$adminUserName)    
    $script = Get-ScriptToRun -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -websiteName $websiteName -overRideParams $overRideParams -removeAdditionalFiles $removeAdditionalFiles -excludeFilesFromAppData $excludeFilesFromAppData -takeAppOffline $takeAppOffline -additionalArguments $additionalArguments
    Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel -webDeployPackage $webDeployPackage
}
