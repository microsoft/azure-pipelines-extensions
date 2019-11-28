[CmdletBinding()]
param()

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Import-Module $env:CURRENT_TASK_ROOTDIR\ps_modules\VstsTaskSdk

Trace-VstsEnteringInvocation $MyInvocation

# Import the loc strings.
Import-VstsLocStrings -LiteralPath $env:CURRENT_TASK_ROOTDIR\task.json

# Get inputs for the task
$machinesList = Get-VstsInput -Name machinesList -Require
$adminUserName = Get-VstsInput -Name AdminUserName -Require
$adminPassword = Get-VstsInput -Name AdminPassword -Require
$winrmProtocol = Get-VstsInput -Name WinRMProtocol -Require
$testCertificate = Get-VstsInput -Name TestCertificate -AsBool
$iisDeploymentType = Get-VstsInput -Name IISDeploymentType -Require
$actionIISWebsite = Get-VstsInput -Name ActionIISWebsite
$actionIISApplicationPool = Get-VstsInput -Name ActionIISApplicationPool
$startStopWebsiteName = Get-VstsInput -Name StartStopWebsiteName
$websiteName = Get-VstsInput -Name WebsiteName
$websitePhysicalPath = Get-VstsInput -Name WebsitePhysicalPath
$websitePhysicalPathAuth = Get-VstsInput -Name WebsitePhysicalPathAuth
$websiteAuthUserName = Get-VstsInput -Name WebsiteAuthUserName
$websiteAuthUserPassword = Get-VstsInput -Name WebsiteAuthUserPassword
$addBinding = Get-VstsInput -Name AddBinding -AsBool
$protocol = Get-VstsInput -Name Protocol
$ipAddress = Get-VstsInput -Name IPAddress
$port = Get-VstsInput -Name Port
$serverNameIndication = Get-VstsInput -Name ServerNameIndication -AsBool
$hostNameWithOutSNI = Get-VstsInput -Name HostNameWithOutSNI
$hostNameWithHttp = Get-VstsInput -Name HostNameWithHttp
$hostNameWithSNI = Get-VstsInput -Name HostNameWithSNI
$sslCertThumbPrint = Get-VstsInput -Name SSLCertThumbPrint
$createOrUpdateAppPoolForWebsite = Get-VstsInput -Name CreateOrUpdateAppPoolForWebsite -AsBool
$configureAuthenticationForWebsite = Get-VstsInput -Name ConfigureAuthenticationForWebsite -AsBool
$appPoolNameForWebsite = Get-VstsInput -Name AppPoolNameForWebsite
$dotNetVersionForWebsite = Get-VstsInput -Name DotNetVersionForWebsite
$pipeLineModeForWebsite = Get-VstsInput -Name PipeLineModeForWebsite
$appPoolIdentityForWebsite = Get-VstsInput -Name AppPoolIdentityForWebsite
$appPoolUsernameForWebsite = Get-VstsInput -Name AppPoolUsernameForWebsite
$appPoolPasswordForWebsite = Get-VstsInput -Name AppPoolPasswordForWebsite
$anonymousAuthenticationForWebsite = Get-VstsInput -Name AnonymousAuthenticationForWebsite -AsBool
$basicAuthenticationForWebsite = Get-VstsInput -Name BasicAuthenticationForWebsite -AsBool
$windowsAuthenticationForWebsite = Get-VstsInput -Name WindowsAuthenticationForWebsite -AsBool
$parentWebsiteNameForVD = Get-VstsInput -Name ParentWebsiteNameForVD
$virtualPathForVD = Get-VstsInput -Name VirtualPathForVD
$physicalPathForVD = Get-VstsInput -Name PhysicalPathForVD
$vdPhysicalPathAuth = Get-VstsInput -Name VDPhysicalPathAuth
$vdAuthUserName = Get-VstsInput -Name VDAuthUserName
$vdAuthUserPassword = Get-VstsInput -Name VDAuthUserPassword
$parentWebsiteNameForApplication = Get-VstsInput -Name ParentWebsiteNameForApplication
$virtualPathForApplication = Get-VstsInput -Name VirtualPathForApplication
$physicalPathForApplication = Get-VstsInput -Name PhysicalPathForApplication
$applicationPhysicalPathAuth = Get-VstsInput -Name ApplicationPhysicalPathAuth
$applicationAuthUserName = Get-VstsInput -Name ApplicationAuthUserName
$applicationAuthUserPassword = Get-VstsInput -Name ApplicationAuthUserPassword
$createOrUpdateAppPoolForApplication = Get-VstsInput -Name CreateOrUpdateAppPoolForApplication -AsBool
$appPoolNameForApplication = Get-VstsInput -Name AppPoolNameForApplication
$dotNetVersionForApplication = Get-VstsInput -Name DotNetVersionForApplication
$pipeLineModeForApplication = Get-VstsInput -Name PipeLineModeForApplication
$appPoolIdentityForApplication = Get-VstsInput -Name AppPoolIdentityForApplication
$appPoolUsernameForApplication = Get-VstsInput -Name AppPoolUsernameForApplication
$appPoolPasswordForApplication = Get-VstsInput -Name AppPoolPasswordForApplication
$appPoolName = Get-VstsInput -Name AppPoolName
$dotNetVersion = Get-VstsInput -Name DotNetVersion
$pipeLineMode = Get-VstsInput -Name PipeLineMode
$appPoolIdentity = Get-VstsInput -Name AppPoolIdentity
$appPoolUsername = Get-VstsInput -Name AppPoolUsername
$appPoolPassword = Get-VstsInput -Name AppPoolPassword
$startStopRecycleAppPoolName = Get-VstsInput -Name StartStopRecycleAppPoolName
$appCmdCommands = Get-VstsInput -Name AppCmdCommands
$deployInParallel = Get-VstsInput -Name DeployInParallel -AsBool

if ([Console]::InputEncoding -is [Text.UTF8Encoding] -and [Console]::InputEncoding.GetPreamble().Length -ne 0) 
{ 
	Write-Verbose "Resetting input encoding."
	[Console]::InputEncoding = New-Object Text.UTF8Encoding $false 
}

. $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
. $env:CURRENT_TASK_ROOTDIR\Utility.ps1

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