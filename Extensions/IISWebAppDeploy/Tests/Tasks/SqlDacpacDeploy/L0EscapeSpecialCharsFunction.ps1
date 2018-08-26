[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\SqlDacpacDeploy\DeployToSqlServer.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\Utility.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should add powershell escape character for double quotes When input string contains double quote character
Assert-AreEqual (EscapeSpecialChars -str 'StringWithDouble"Quotes') 'StringWithDouble`"Quotes'

# Test 2: Should add powershell escape character for dollar symbol When input string contains dollar symbol character
Assert-AreEqual (EscapeSpecialChars -str 'StringWith$dollar') 'StringWith`$dollar'

# Test 3: Should add powershell escape ` and $ symbol character When input string contains ` and $ symbol character
Assert-AreEqual (EscapeSpecialChars -str 'StringWith`$dollar') 'StringWith```$dollar'