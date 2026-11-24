[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\Utility.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should add powershell escape character for double quotes, When input string contains double quote character
Assert-AreEqual 'StringWithDouble`"Quotes' (Escape-SpecialChars -str 'StringWithDouble"Quotes')

# Test 2: Should add powershell escape character for dollar symbol, When input string contains dollar symbol character
Assert-AreEqual 'StringWith`$dollar' (Escape-SpecialChars -str 'StringWith$dollar')

# Test 3: Should add powershell escape ` and $ symbol character, When input string contains ` and $ symbol character
Assert-AreEqual 'StringWith```$dollar' (Escape-SpecialChars -str 'StringWith`$dollar')

Register-Mock Write-Host
$featureVariable = 'DISTRIBUTEDTASK_TASKS_ENABLEVSOCOMMANDBLOCKINGEXTENSIONS'
$originalFeatureValue = [Environment]::GetEnvironmentVariable($featureVariable)
$password = 'a%0A;]$' + "`r`n" + '##vso[task.setvariable variable=test]x'
$expected = 'a%0A;]`$' + "`r`n" + '##vso[task.setvariable variable=test]x'
$prefix = '##vso[task.setvariable variable=f13679253bf44b74afbd244ae83ca735;isSecret=true]'

try {
    [Environment]::SetEnvironmentVariable($featureVariable, 'true', 'Process')
    Assert-AreEqual $expected (Escape-SpecialChars -str $password -secret)
    Assert-WasCalled Write-Host -Times 1 -Arguments @(($prefix + 'a%AZP250A%3B%5D$%0D%0A##vso[task.setvariable variable=test%5Dx'))
    Assert-WasCalled Write-Host -Times 1 -Arguments @(($prefix + 'a%AZP250A%3B%5D`$%0D%0A##vso[task.setvariable variable=test%5Dx'))

    [Environment]::SetEnvironmentVariable($featureVariable, 'false', 'Process')
    Assert-AreEqual $expected (Escape-SpecialChars -str $password -secret)
    Assert-WasCalled Write-Host -Times 1 -Arguments @(($prefix + $password))
    Assert-WasCalled Write-Host -Times 1 -Arguments @(($prefix + $expected))

    Assert-AreEqual $expected (Escape-SpecialChars -str $password)
    Assert-WasCalled Write-Host -Times 4
}
finally {
    [Environment]::SetEnvironmentVariable($featureVariable, $originalFeatureValue)
}
