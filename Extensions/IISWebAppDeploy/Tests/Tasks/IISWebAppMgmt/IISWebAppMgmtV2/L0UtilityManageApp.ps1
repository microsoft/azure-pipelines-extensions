[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\Utility.ps1

$parentWebsiteNameForApplication = "Sample Web Site"
$virtualPathForApplication = "/Application"
$physicalPathForApplication = "Drive:/Physical Path"
$applicationPhysicalPathAuth = "ApplicationUserPassThrough"
$applicationAuthUserName = ""
$applicationAuthUserPassword = ""

$createOrUpdateAppPoolForApplication = "false"
$appPoolNameForApplication = "Sample App Pool"
$dotNetVersionForApplication = "v4.0"
$pipeLineModeForApplication = "Integrated"
$appPoolIdentityForApplication = "ApplicationPoolIdentity"
$appPoolUsernameForApplication = ""
$appPoolPasswordForApplication = ""
$appCmdCommands = ""

# Test 1 

$result = Set-IISWebApplication -parentWebsiteName $parentWebsiteNameForApplication -virtualPath $virtualPathForApplication -physicalPath $physicalPathForApplication -physicalPathAuth $applicationPhysicalPathAuth -physicalPathAuthUserName $applicationAuthUserName -physicalPathAuthUserPassword $applicationAuthUserPassword `
            -createOrUpdateAppPool $createOrUpdateAppPoolForApplication -appPoolName $appPoolNameForApplication -dotNetVersion $dotNetVersionForApplication -pipeLineMode $pipeLineModeForApplication -appPoolIdentity $appPoolIdentityForApplication -appPoolUsername $appPoolUsernameForApplication -appPoolPassword $appPoolPasswordForApplication `
            -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -CreateApplication $true -WebsiteName "Sample Web Site" -VirtualPath "/Application" -PhysicalPath "Drive:/Physical Path" -PhysicalPathAuth "ApplicationUserPassThrough" -PhysicalPathAuthUsername "" -PhysicalPathAuthUserPassword "" -AppCmdCommands ""' $result

# Test 2 

$applicationPhysicalPathAuth = "ApplicationWindowsAuth"
$createOrUpdateAppPoolForApplication = "true"
$appPoolIdentityForApplication = "SpecificUser"
$appPoolUsernameForApplication = ""
$appPoolPasswordForApplication = ""

$result = Set-IISWebApplication -parentWebsiteName $parentWebsiteNameForApplication -virtualPath $virtualPathForApplication -physicalPath $physicalPathForApplication -physicalPathAuth $applicationPhysicalPathAuth -physicalPathAuthUserName $applicationAuthUserName -physicalPathAuthUserPassword $applicationAuthUserPassword `
            -createOrUpdateAppPool $createOrUpdateAppPoolForApplication -appPoolName $appPoolNameForApplication -dotNetVersion $dotNetVersionForApplication -pipeLineMode $pipeLineModeForApplication -appPoolIdentity $appPoolIdentityForApplication -appPoolUsername $appPoolUsernameForApplication -appPoolPassword $appPoolPasswordForApplication `
            -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -CreateApplication $true -WebsiteName "Sample Web Site" -VirtualPath "/Application" -PhysicalPath "Drive:/Physical Path" -PhysicalPathAuth "ApplicationWindowsAuth" -PhysicalPathAuthUsername "" -PhysicalPathAuthUserPassword "" -ActionIISApplicationPool "CreateOrUpdateAppPool" -AppPoolName "Sample App Pool" -DotNetVersion "v4.0" -PipeLineMode "Integrated" -AppPoolIdentity SpecificUser -AppPoolUsername "" -AppPoolPassword "" -AppCmdCommands ""' $result

# Test 3

$virtualPathForApplication = "Application"

Assert-Throws {
    Set-IISWebApplication -parentWebsiteName $parentWebsiteNameForApplication -virtualPath $virtualPathForApplication -physicalPath $physicalPathForApplication -physicalPathAuth $applicationPhysicalPathAuth -physicalPathAuthUserName $applicationAuthUserName -physicalPathAuthUserPassword $applicationAuthUserPassword `
        -createOrUpdateAppPool $createOrUpdateAppPoolForApplication -appPoolName $appPoolNameForApplication -dotNetVersion $dotNetVersionForApplication -pipeLineMode $pipeLineModeForApplication -appPoolIdentity $appPoolIdentityForApplication -appPoolUsername $appPoolUsernameForApplication -appPoolPassword $appPoolPasswordForApplication `
        -appCmdCommands $appCmdCommands
} -MessagePattern "Virtual path should begin with a /"