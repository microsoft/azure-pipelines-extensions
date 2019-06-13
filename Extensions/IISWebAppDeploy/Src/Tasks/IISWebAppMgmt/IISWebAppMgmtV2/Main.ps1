param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [string]$iisDeploymentType,
    [string]$actionIISWebsite,
    [string]$actionIISApplicationPool,
    [string]$startStopWebsiteName,
    [string]$websiteName,
    [string]$websitePhysicalPath,
    [string]$websitePhysicalPathAuth,
    [string]$websiteAuthUserName,
    [string]$websiteAuthUserPassword,
    [string]$addBinding,
    [string]$protocol,
    [string]$ipAddress,
    [string]$port,
    [string]$serverNameIndication,
    [string]$hostNameWithOutSNI,
    [string]$hostNameWithHttp,
    [string]$hostNameWithSNI,
    [string]$sslCertThumbPrint,
    [string]$createOrUpdateAppPoolForWebsite,
    [string]$configureAuthenticationForWebsite,
    [string]$appPoolNameForWebsite,
    [string]$dotNetVersionForWebsite,
    [string]$pipeLineModeForWebsite,
    [string]$appPoolIdentityForWebsite,
    [string]$appPoolUsernameForWebsite,
    [string]$appPoolPasswordForWebsite,
    [string]$anonymousAuthenticationForWebsite,
    [string]$basicAuthenticationForWebsite,
    [string]$windowsAuthenticationForWebsite,
    [string]$parentWebsiteNameForVD,
    [string]$virtualPathForVD,
    [string]$physicalPathForVD,
    [string]$vdPhysicalPathAuth,
    [string]$vdAuthUserName,
    [string]$vdAuthUserPassword,
    [string]$parentWebsiteNameForApplication,
    [string]$virtualPathForApplication,
    [string]$physicalPathForApplication,
    [string]$applicationPhysicalPathAuth,
    [string]$applicationAuthUserName,
    [string]$applicationAuthUserPassword,
    [string]$createOrUpdateAppPoolForApplication,
    [string]$appPoolNameForApplication,
    [string]$dotNetVersionForApplication,
    [string]$pipeLineModeForApplication,
    [string]$appPoolIdentityForApplication,
    [string]$appPoolUsernameForApplication,
    [string]$appPoolPasswordForApplication,
    [string]$appPoolName,
    [string]$dotNetVersion,
    [string]$pipeLineMode,
    [string]$appPoolIdentity,
    [string]$appPoolUsername,
    [string]$appPoolPassword,
    [string]$startStopRecycleAppPoolName,
    [string]$appCmdCommands,
    [string]$deployInParallel
    )

if ([Console]::InputEncoding -is [Text.UTF8Encoding] -and [Console]::InputEncoding.GetPreamble().Length -ne 0) 
{ 
	Write-Verbose "Resetting input encoding."
	[Console]::InputEncoding = New-Object Text.UTF8Encoding $false 
}

$currentTaskVersionRootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:CURRENT_TASK_ROOTDIR = $currentTaskVersionRootDir

. $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
. $currentTaskVersionRootDir\Utility.ps1

try {
    $appPoolPassword = Escape-SpecialChars -str $appPoolPassword
    $websiteAuthUserPassword = Escape-SpecialChars -str $websiteAuthUserPassword
    $appCmdCommands = Escape-SpecialChars -str $appCmdCommands

    $invokeMain = ""
    $action = ""

    switch ($iisDeploymentType)
    {
        "IISWebsite" 
        {
            $invokeMain = Set-IISWebsite -actionIISWebsite $actionIISWebsite -websiteName $websiteName -startStopWebsiteName $startStopWebsiteName -physicalPath $websitePhysicalPath -physicalPathAuth $websitePhysicalPathAuth -physicalPathAuthUserName $websiteAuthUserName -physicalPathAuthUserPassword $websiteAuthUserPassword `
                -addBinding $addBinding -bindings $bindings -protocol $protocol -ipAddress $ipAddress -port $port -serverNameIndication $serverNameIndication `
                -hostNameWithOutSNI $hostNameWithOutSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -sslCertThumbPrint $sslCertThumbPrint `
                -createOrUpdateAppPool $createOrUpdateAppPoolForWebsite -appPoolName $appPoolNameForWebsite -dotNetVersion $dotNetVersionForWebsite -pipeLineMode $pipeLineModeForWebsite -appPoolIdentity $appPoolIdentityForWebsite -appPoolUsername $appPoolUsernameForWebsite -appPoolPassword $appPoolPasswordForWebsite `
                -configureAuthentication $configureAuthenticationForWebsite -anonymousAuthentication $anonymousAuthenticationForWebsite -basicAuthentication $basicAuthenticationForWebsite -windowsAuthentication $windowsAuthenticationForWebsite -appCmdCommands $appCmdCommands

            $action = $actionIISWebsite
        }
        "IISWebApplication" 
        {
            $invokeMain = Set-IISWebApplication -parentWebsiteName $parentWebsiteNameForApplication -virtualPath $virtualPathForApplication -physicalPath $physicalPathForApplication -physicalPathAuth $applicationPhysicalPathAuth -physicalPathAuthUserName $applicationAuthUserName -physicalPathAuthUserPassword $applicationAuthUserPassword `
                -createOrUpdateAppPool $createOrUpdateAppPoolForApplication -appPoolName $appPoolNameForApplication -dotNetVersion $dotNetVersionForApplication -pipeLineMode $pipeLineModeForApplication -appPoolIdentity $appPoolIdentityForApplication -appPoolUsername $appPoolUsernameForApplication -appPoolPassword $appPoolPasswordForApplication `
                -appCmdCommands $appCmdCommands

        }
        "IISVirtualDirectory" 
        {
            $invokeMain = Set-IISVirtualDirectory -parentWebsiteName $parentWebsiteNameForVD -virtualPath $virtualPathForVD -physicalPath $physicalPathForVD -PhysicalPathAuth  $vdPhysicalPathAuth `
                -physicalPathAuthUserName $vdAuthUserName -physicalPathAuthUserPassword $vdAuthUserPassword -appCmdCommands $appCmdCommands
        }
        "IISApplicationPool" 
        {
            $invokeMain = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands

            $action = $actionIISApplicationPool
        }
        default 
        {
            throw ("Invalid IIS Deployment Type : $iisDeploymentType")
        }
    }
    
    $msDeployScript = Get-Content ./AppCmdOnTargetMachines.ps1 | Out-String
    Write-Verbose "Executing main funnction in AppCmdOnTargetMachines : $invokeMain"
    $script = [string]::Format("{0} {1} ( {2} )", $msDeployScript, [Environment]::NewLine, $invokeMain)

    Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel -iisDeploymentType $iisDeploymentType -action $action
}
catch [Exception] 
{    
    Write-Error ("Caught exception while executing main function: $($_.Exception.Message)")
}