[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\SqlDacpacDeploy\DeployToSqlServer.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\Utility.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$dacpacFileNoExtraQuotes = "sample.dacpac"
$pubProfileNoExtraQuotes = "c:\pub.xml"
$sqlFileNoExtraQuotes = ""

$adminUserNoSpaces = "adminuser"
$sqlUserNoSpaces = "sqluser"

# Test 1: Should remove extra quotes for all inputs except usernames
$dacpacFile = "`"sample.dacpac`""
$pubProfile = "`"c:\pub.xml`""
$sqlFile = "`"sample.sql`""

TrimInputs -dacpacFile ([ref]$dacpacFile) -publishProfile ([ref]$pubProfile)  -adminUserName ([ref]$adminUserNoSpaces) -sqlUsername ([ref]$sqlUserNoSpaces) -sqlFile ([ref]$sqlFile)

Assert-AreEqual $dacpacFile $dacpacFileNoExtraQuotes
Assert-AreEqual $pubProfile $pubProfileNoExtraQuotes

# Test 2: Should remove extra spaces for sqlUsername, adminUserName
$adminUser = " adminuser"
$sqlUser = " sqluser "

TrimInputs -dacpacFile ([ref]$dacpacFileNoExtraQuotes) -publishProfile ([ref]$pubProfileNoExtraQuotes)  -adminUserName ([ref]$adminUser) -sqlUsername ([ref]$sqlUser) -sqlFile ([ref]$sqlFileNoExtraQuotes)

Assert-AreEqual $adminUser $adminUserNoSpaces
Assert-AreEqual $sqlUser $sqlUserNoSpaces
