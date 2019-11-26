[CmdletBinding()]
param()

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Import-Module $env:CURRENT_TASK_ROOTDIR\ps_modules\VstsTaskSdk

Trace-VstsEnteringInvocation $MyInvocation

# Import the loc strings.
Import-VstsLocStrings -LiteralPath $env:CURRENT_TASK_ROOTDIR\task.json

# Get inputs for the task
$machinesList = Get-VstsInput -Name MachinesList -Require
$adminUserName = Get-VstsInput -Name AdminUserName -Require
$adminPassword = Get-VstsInput -Name AdminPassword -Require
$winrmProtocol = Get-VstsInput -Name WinrmProtocol -Require
$testCertificate = Get-VstsInput -Name TestCertificate
$iisDeploymentType = Get-VstsInput -Name WebDeployPackage -Require
$actionIISWebsite = Get-VstsInput -Name WebDeployParamFile
$actionIISApplicationPool = Get-VstsInput -Name OverRideParams
$startStopWebsiteName = Get-VstsInput -Name WebsiteName -Require
$websiteName = Get-VstsInput -Name RemoveAdditionalFiles
$websitePhysicalPath = Get-VstsInput -Name ExcludeFilesFromAppData
$websitePhysicalPathAuth = Get-VstsInput -Name TakeAppOffline
$websiteAuthUserName = Get-VstsInput -Name AdditionalArguments
$websiteAuthUserPassword = Get-VstsInput -Name DeployInParallel
$addBinding = Get-VstsInput -Name MachinesList -Require
$protocol = Get-VstsInput -Name AdminUserName -Require
$ipAddress = Get-VstsInput -Name AdminPassword -Require
$port = Get-VstsInput -Name WinrmProtocol -Require
$serverNameIndication = Get-VstsInput -Name TestCertificate
$hostNameWithOutSNI = Get-VstsInput -Name WebDeployPackage -Require
$hostNameWithHttp = Get-VstsInput -Name WebDeployParamFile
$hostNameWithSNI = Get-VstsInput -Name OverRideParams
$sslCertThumbPrint = Get-VstsInput -Name WebsiteName -Require
$createOrUpdateAppPoolForWebsite = Get-VstsInput -Name RemoveAdditionalFiles
$configureAuthenticationForWebsite = Get-VstsInput -Name ExcludeFilesFromAppData
$appPoolNameForWebsite = Get-VstsInput -Name TakeAppOffline
$dotNetVersionForWebsite = Get-VstsInput -Name AdditionalArguments
$pipeLineModeForWebsite = Get-VstsInput -Name DeployInParallel
$appPoolIdentityForWebsite = Get-VstsInput -Name MachinesList -Require
$appPoolUsernameForWebsite = Get-VstsInput -Name AdminUserName -Require
$appPoolPasswordForWebsite = Get-VstsInput -Name AdminPassword -Require
$anonymousAuthenticationForWebsite = Get-VstsInput -Name WinrmProtocol -Require
$basicAuthenticationForWebsite = Get-VstsInput -Name TestCertificate
$windowsAuthenticationForWebsite = Get-VstsInput -Name WebDeployPackage -Require
$parentWebsiteNameForVD = Get-VstsInput -Name WebDeployParamFile
$virtualPathForVD = Get-VstsInput -Name OverRideParams
$physicalPathForVD = Get-VstsInput -Name WebsiteName -Require
$vdPhysicalPathAuth = Get-VstsInput -Name RemoveAdditionalFiles
$vdAuthUserName = Get-VstsInput -Name ExcludeFilesFromAppData
$vdAuthUserPassword = Get-VstsInput -Name TakeAppOffline
$parentWebsiteNameForApplication = Get-VstsInput -Name WinrmProtocol -Require
$virtualPathForApplication = Get-VstsInput -Name TestCertificate
$physicalPathForApplication = Get-VstsInput -Name WebDeployPackage -Require
$applicationPhysicalPathAuth = Get-VstsInput -Name WebDeployParamFile
$applicationAuthUserName = Get-VstsInput -Name OverRideParams
$applicationAuthUserPassword = Get-VstsInput -Name WebsiteName -Require
$createOrUpdateAppPoolForApplication = Get-VstsInput -Name RemoveAdditionalFiles
$appPoolNameForApplication = Get-VstsInput -Name ExcludeFilesFromAppData
$dotNetVersionForApplication = Get-VstsInput -Name TakeAppOffline
$pipeLineModeForApplication = Get-VstsInput -Name WebsiteName -Require
$appPoolIdentityForApplication = Get-VstsInput -Name RemoveAdditionalFiles
$appPoolUsernameForApplication = Get-VstsInput -Name ExcludeFilesFromAppData
$appPoolPasswordForApplication = Get-VstsInput -Name TakeAppOffline
$appPoolName = Get-VstsInput -Name WinrmProtocol -Require
$dotNetVersion = Get-VstsInput -Name TestCertificate
$pipeLineMode = Get-VstsInput -Name WebDeployPackage -Require
$appPoolIdentity = Get-VstsInput -Name WebDeployParamFile
$appPoolUsername = Get-VstsInput -Name OverRideParams
$appPoolPassword = Get-VstsInput -Name WebsiteName -Require
$startStopRecycleAppPoolName = Get-VstsInput -Name RemoveAdditionalFiles
$appCmdCommands = Get-VstsInput -Name ExcludeFilesFromAppData
$deployInParallel = Get-VstsInput -Name TakeAppOffline

if ([Console]::InputEncoding -is [Text.UTF8Encoding] -and [Console]::InputEncoding.GetPreamble().Length -ne 0) 
{ 
	Write-Verbose "Resetting input encoding."
	[Console]::InputEncoding = New-Object Text.UTF8Encoding $false 
}

. $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
. $currentTaskVersionRootDir\Utility.ps1

try {
    $appPoolPassword = Escape-SpecialChars -str $appPoolPassword
    $websiteAuthUserPassword = Escape-SpecialChars -str $websiteAuthUserPassword
    $appCmdCommands = Escape-SpecialChars -str $appCmdCommands

    $invokeMain = ""
    $invokeMainLog = ""
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
                
            $invokeMainLog = Set-IISWebsite -actionIISWebsite $actionIISWebsite -websiteName $websiteName -startStopWebsiteName $startStopWebsiteName -physicalPath $websitePhysicalPath -physicalPathAuth $websitePhysicalPathAuth -physicalPathAuthUserName $websiteAuthUserName -physicalPathAuthUserPassword **** `
                -addBinding $addBinding -bindings $bindings -protocol $protocol -ipAddress $ipAddress -port $port -serverNameIndication $serverNameIndication `
                -hostNameWithOutSNI $hostNameWithOutSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -sslCertThumbPrint $sslCertThumbPrint `
                -createOrUpdateAppPool $createOrUpdateAppPoolForWebsite -appPoolName $appPoolNameForWebsite -dotNetVersion $dotNetVersionForWebsite -pipeLineMode $pipeLineModeForWebsite -appPoolIdentity $appPoolIdentityForWebsite -appPoolUsername $appPoolUsernameForWebsite -appPoolPassword **** `
                -configureAuthentication $configureAuthenticationForWebsite -anonymousAuthentication $anonymousAuthenticationForWebsite -basicAuthentication $basicAuthenticationForWebsite -windowsAuthentication $windowsAuthenticationForWebsite -appCmdCommands $appCmdCommands

            $action = $actionIISWebsite
        }
        "IISWebApplication" 
        {
            $invokeMain = Set-IISWebApplication -parentWebsiteName $parentWebsiteNameForApplication -virtualPath $virtualPathForApplication -physicalPath $physicalPathForApplication -physicalPathAuth $applicationPhysicalPathAuth -physicalPathAuthUserName $applicationAuthUserName -physicalPathAuthUserPassword $applicationAuthUserPassword `
                -createOrUpdateAppPool $createOrUpdateAppPoolForApplication -appPoolName $appPoolNameForApplication -dotNetVersion $dotNetVersionForApplication -pipeLineMode $pipeLineModeForApplication -appPoolIdentity $appPoolIdentityForApplication -appPoolUsername $appPoolUsernameForApplication -appPoolPassword $appPoolPasswordForApplication `
                -appCmdCommands $appCmdCommands
            
            $invokeMainLog = Set-IISWebApplication -parentWebsiteName $parentWebsiteNameForApplication -virtualPath $virtualPathForApplication -physicalPath $physicalPathForApplication -physicalPathAuth $applicationPhysicalPathAuth -physicalPathAuthUserName $applicationAuthUserName -physicalPathAuthUserPassword **** `
                -createOrUpdateAppPool $createOrUpdateAppPoolForApplication -appPoolName $appPoolNameForApplication -dotNetVersion $dotNetVersionForApplication -pipeLineMode $pipeLineModeForApplication -appPoolIdentity $appPoolIdentityForApplication -appPoolUsername $appPoolUsernameForApplication -appPoolPassword **** `
                -appCmdCommands $appCmdCommands

        }
        "IISVirtualDirectory" 
        {
            $invokeMain = Set-IISVirtualDirectory -parentWebsiteName $parentWebsiteNameForVD -virtualPath $virtualPathForVD -physicalPath $physicalPathForVD -PhysicalPathAuth  $vdPhysicalPathAuth `
                -physicalPathAuthUserName $vdAuthUserName -physicalPathAuthUserPassword $vdAuthUserPassword -appCmdCommands $appCmdCommands
            
            $invokeMainLog = Set-IISVirtualDirectory -parentWebsiteName $parentWebsiteNameForVD -virtualPath $virtualPathForVD -physicalPath $physicalPathForVD -PhysicalPathAuth  $vdPhysicalPathAuth `
                -physicalPathAuthUserName $vdAuthUserName -physicalPathAuthUserPassword **** -appCmdCommands $appCmdCommands
        }
        "IISApplicationPool" 
        {
            $invokeMain = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands
                
            $invokeMainLog = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword **** -appCmdCommands $appCmdCommands

            $action = $actionIISApplicationPool
        }
        default 
        {
            throw ("Invalid IIS Deployment Type : $iisDeploymentType")
        }
    }
    
    $msDeployScript = Get-Content ./AppCmdOnTargetMachines.ps1 | Out-String
    Write-Verbose "Executing main function in AppCmdOnTargetMachines : $invokeMainLog"
    $script = [string]::Format("{0} {1} ( {2} )", $msDeployScript, [Environment]::NewLine, $invokeMain)

    Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel -iisDeploymentType $iisDeploymentType -action $action
}
catch
{    
    Write-Verbose $_.Exception.ToString() -Verbose
    throw
}
finally
{
    Trace-VstsLeavingInvocation $MyInvocation
}