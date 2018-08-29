[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\DeployIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$pkgNoExtraQuotes = "webdeploy.zip"
$paramfileNoExtraQuotes = "paramfile.xml"
$siteNoExtraQuotes = "website"
$adminUserNoSpaces = "adminuser"

# Test 1: Should remove extra quotes for all inputs except usernames
$pkg = "`"webdeploy.zip`""
$paramfile = "`"paramfile.xml`""
$site = "`"website`""

Trim-Inputs -package ([ref]$pkg) -paramFile ([ref]$paramfile) -siteName ([ref]$site) -adminUser ([ref]$adminUserNoSpaces)

Assert-AreEqual $pkg $pkgNoExtraQuotes
Assert-AreEqual $paramfile $paramfileNoExtraQuotes
Assert-AreEqual $site $siteNoExtraQuotes

# Test 2: Should remove extra spaces for adminUserName
$adminUser = " adminuser "

Trim-Inputs -package ([ref]$pkgNoExtraQuotes) -paramFile ([ref]$paramfileNoExtraQuotes) -siteName ([ref]$siteNoExtraQuotes) -adminUser ([ref]$adminUser)

Assert-AreEqual $adminUser $adminUserNoSpaces