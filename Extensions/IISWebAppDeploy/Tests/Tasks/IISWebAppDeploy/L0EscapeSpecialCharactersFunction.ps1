[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\DeployIISWebApp.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should add powershell escape character for double quotes
Assert-AreEqual (EscapeSpecialChars -str 'StringWithDouble"Quotes') 'StringWithDouble`"Quotes'

# Test 2: Should add powershell escape character for dollar symbol
Assert-AreEqual (EscapeSpecialChars -str 'StringWith$dollar') 'StringWith`$dollar'

# Test 3: Should add powershell escape for ` and $ symbol character
Assert-AreEqual (EscapeSpecialChars -str 'StringWith`$dollar') 'StringWith```$dollar'
