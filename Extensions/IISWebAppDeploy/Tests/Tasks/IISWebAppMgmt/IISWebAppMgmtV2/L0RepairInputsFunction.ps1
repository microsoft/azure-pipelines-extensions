[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\Utility.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$siteExpected = "website"
$pathExpected = "\\web app\path"
$vPathExpected = "virtual web app\path"
$appPoolNameExpected = "application pool name"
$adminUserExpected = "`"adminuser"
$appPoolUserExpected = "`"apppooluser"

# Test: should convert to expected outputs
$site = "`" website`""
$path = "`" \\web app\path\`""
$vPath = "`" \\virtual web app\path\`""
$appPoolName = "`" application pool name`""
$adminUser = " `"adminuser"
$appPoolUser = " `"apppooluser"

Repair-Inputs -siteName ([ref]$site) -physicalPath ([ref]$path) -poolName ([ref]$appPoolName) -virtualPath ([ref]$vPath) -physicalPathAuthuser ([ref]$adminUser) -appPoolUser ([ref]$appPoolUser)
Assert-AreEqual $siteExpected $site 
Assert-AreEqual $pathExpected $path
Assert-AreEqual $vPathExpected $vPath
Assert-AreEqual $appPoolNameExpected $appPoolName
Assert-AreEqual $adminUserExpected $adminUser
Assert-AreEqual $appPoolUserExpected $appPoolUser
