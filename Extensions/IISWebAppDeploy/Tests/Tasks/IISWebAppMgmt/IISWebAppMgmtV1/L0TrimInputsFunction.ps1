[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\ManageIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$siteNoExtraQuotes = "website"
$pathNoExtraQuotes = "\\web app\path"
$appPoolNameNoExtraQuotes = "application pool name"

$siteAuthUserNoSpaces = "dummyuser"
$adminUserNoSpaces = "adminuser"
$appPoolUserNoSpaces = "apppooluser"
$sslCertThumbPrintNoSpaces = "de86af66a9624ddbc3a1055f937be9c000d6b8a1"

# Test 1: should not have extra double quotes, Should remove extra quotes for all inputs except usernames and thumbprint
$site = "`"website`""
$path = "`"\\web app\path\`""
$appPoolName = "`"application pool name`""
Trim-Inputs -siteName ([ref]$site) -physicalPath ([ref]$path)  -poolName ([ref]$appPoolName) -websitePathAuthuser ([ref]$siteAuthUserNoSpaces) -appPoolUser ([ref]$appPoolUserNoSpaces) -adminUser ([ref]$adminUserNoSpaces) -sslCertThumbPrint ([ref]$sslCertThumbPrintNoSpaces)
Assert-AreEqual $siteNoExtraQuotes $site 
Assert-AreEqual $pathNoExtraQuotes $path
Assert-AreEqual $appPoolNameNoExtraQuotes $appPoolName

# Test 2: should not have extra double quotes, Should remove extra spaces for appPooluserName, websiteAuthUser, adminUserName, sslCertThumbPrint
$siteAuthUser = " dummyuser"
$adminUser = " adminuser "
$appPoolUser = " apppooluser "
$sslCertThumbPrint = " de86af66a9624ddbc3a1055f937be9c000d6b8a1 "
Trim-Inputs -siteName ([ref]$siteNoExtraQuotes) -physicalPath ([ref]$pathNoExtraQuotes)  -poolName ([ref]$appPoolNameNoExtraQuotes) -websitePathAuthuser ([ref]$siteAuthUser) -appPoolUser ([ref]$appPoolUser) -adminUser ([ref]$adminUser) -sslCertThumbPrint ([ref]$sslCertThumbPrint)
Assert-AreEqual $siteAuthUserNoSpaces $siteAuthUser
Assert-AreEqual $adminUserNoSpaces $adminUser
Assert-AreEqual $appPoolUserNoSpaces $appPoolUser
Assert-AreEqual $sslCertThumbPrintNoSpaces $sslCertThumbPrint
