[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\ManageIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should add powershell escape character for double quotes, When input string contains double quote character
Assert-AreEqual 'StringWithDouble`"Quotes' (Escape-SpecialChars -str 'StringWithDouble"Quotes')

# Test 2: Should add powershell escape character for dollar symbol, When input string contains dollar symbol character
Assert-AreEqual 'StringWith`$dollar' (Escape-SpecialChars -str 'StringWith$dollar')

# Test 3: Should add powershell escape ` and $ symbol character, When input string contains ` and $ symbol character
Assert-AreEqual 'StringWith```$dollar' (Escape-SpecialChars -str 'StringWith`$dollar')
