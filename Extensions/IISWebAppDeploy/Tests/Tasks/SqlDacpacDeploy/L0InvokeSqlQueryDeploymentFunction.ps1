[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1
. $PSScriptRoot\..\..\..\Src\Tasks\SqlDacpacDeploy\TaskModuleSqlUtility\SqlQueryOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should deploy inline Sql, When execute sql is invoked with all inputs for Inline Sql

Register-Mock Test-Path { return $true }
Register-Mock Import-SqlPs { return }
Register-Mock Get-SqlFilepathOnTargetMachine { return "C:\sample.temp" }
Register-Mock Invoke-Sqlcmd { return }

Invoke-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB"

Assert-WasCalled -Command Import-SqlPs -Times 1
Assert-WasCalled -Command Get-SqlFilepathOnTargetMachine -Times 1
Assert-WasCalled -Command Invoke-Sqlcmd -Times 1

Unregister-Mock Test-Path
Unregister-Mock Import-SqlPs
Unregister-Mock Get-SqlFilepathOnTargetMachine
Unregister-Mock Invoke-Sqlcmd

# Test 2: Should have valid additional arguments, When execute sql is invoked with additional arguments for Inline Sql

Register-Mock Test-Path { return $true }
Register-Mock Remove-Item { return }
Register-Mock Import-SqlPs { return }
Register-Mock Get-SqlFilepathOnTargetMachine { return "C:\sample.temp" }
Register-Mock Invoke-Sqlcmd { return } -ParametersEvaluator {$QueryTimeout -eq 50}

Invoke-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -additionalArguments "-QueryTimeout 50 wrongParam"

Assert-WasCalled -Command Import-SqlPs -Times 1
Assert-WasCalled -Command Get-SqlFilepathOnTargetMachine -Times 1
Assert-WasCalled -Command Invoke-Sqlcmd -Times 1

Unregister-Mock Test-Path
Unregister-Mock Import-SqlPs
Unregister-Mock Get-SqlFilepathOnTargetMachine
Unregister-Mock Invoke-Sqlcmd
Unregister-Mock Remove-Item

# Test 3: Should have valid additional arguments with special character, When execute sql is invoked with additional arguments with special character for Inline Sql
Register-Mock Test-Path { return $true }
Register-Mock Import-SqlPs { return }
Register-Mock Get-SqlFilepathOnTargetMachine { return "C:\sample.temp" }
Register-Mock Invoke-Sqlcmd { return } -ParametersEvaluator {$variable -eq "var1=user`$test"}
Register-Mock Remove-Item { return }

Invoke-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -additionalArguments "-variable var1=user`$test"

Assert-WasCalled Import-SqlPs -Times 1
Assert-WasCalled Get-SqlFilepathOnTargetMachine -Times 1
Assert-WasCalled Invoke-Sqlcmd -Times 1

Unregister-Mock Test-Path
Unregister-Mock Import-SqlPs
Unregister-Mock Get-SqlFilepathOnTargetMachine
Unregister-Mock Invoke-Sqlcmd
Unregister-Mock Remove-Item

# Test 4: should throw exception, When execute sql is invoked with Wrong Extension Sql File
Register-Mock Import-SqlPs { return }
Register-Mock Invoke-Expression { return } -ParametersEvaluator {$Command -and $Command.StartsWith("Invoke-Sqlcmd")}
Register-Mock Remove-Item { return }
Register-Mock Test-Path { return $true }

try
{
    Invoke-SqlQueryDeployment -taskType "sqlQuery" -sqlFile "SampleFile.temp" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" 
}
catch
{
    $result = $_
}

Assert-AreEqual ($result.Exception.ToString().Contains("Invalid Sql file [ SampleFile.temp ] provided")) $true

Unregister-Mock Test-Path
Unregister-Mock Import-SqlPs
Unregister-Mock Invoke-Expression
Unregister-Mock Remove-Item

## TODO: raagra: Fix this test
# Test 5: Should deploy inline Sql with Server Authetication, When execute sql is invoked with Server Auth Type
# $secureAdminPassword =  ConvertTo-SecureString "SqlPass" -AsPlainText -Force
# $psCredential = New-Object System.Management.Automation.PSCredential ("SqlUser", $secureAdminPassword)
# Register-Mock Test-Path { return $true }
# Register-Mock Import-SqlPs { return }
# Register-Mock Get-SqlFilepathOnTargetMachine { return "C:\sample.temp" }
# Register-Mock Invoke-Sqlcmd { return } -ParametersEvaluator {($Username -eq "SqlUser") -and ($Password -eq "SqlPass")}

# Invoke-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -sqlServerCredentials $psCredential -authscheme sqlServerAuthentication

# Assert-WasCalled Import-SqlPs -Times 1
# Assert-WasCalled Get-SqlFilepathOnTargetMachine -Times 1
# Assert-WasCalled Invoke-Sqlcmd -Times 1

# Test 6: Should deploy inline Sql, When finally gets called and Test-Path Fails
Register-Mock Import-SqlPs { throw }
Register-Mock Get-SqlFilepathOnTargetMachine { return "C:\sample.temp" }
# Marking Test Path as false so that Remove-Item is not called 
# This tests Finally Part
Register-Mock Test-Path { return $false }
Register-Mock Remove-Item { return }

try
{
    Invoke-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" 
}
catch
{
# Do Nothing
}

Assert-WasCalled -Command Test-Path -Times 1
Assert-WasCalled -Command Remove-Item -Times 0

Unregister-Mock Test-Path
Unregister-Mock Import-SqlPs
Unregister-Mock Get-SqlFilepathOnTargetMachine
Unregister-Mock Remove-Item

# Test 7: Should deploy inline Sql, When finally gets called and Test-Path Returns True
Register-Mock Import-SqlPs { throw }
Register-Mock Get-SqlFilepathOnTargetMachine { return "C:\sample.temp" }
# Marking Test Path as true so that Remove -Item is called 
# This tests Finally Part
Register-Mock Test-Path { return $true }
Register-Mock Remove-Item { return }

try
{
    Invoke-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" 
}
catch
{
    # Do Nothing
}

Assert-WasCalled -Command Test-Path -Times 1
Assert-WasCalled -Command Remove-Item -Times 1

Unregister-Mock Test-Path
Unregister-Mock Import-SqlPs
Unregister-Mock Get-SqlFilepathOnTargetMachine
Unregister-Mock Remove-Item

# Test 8: Should Short Circuit in Finally, When execute sql is invoked with Sql File, Finally is no Op
Register-Mock Import-SqlPs { throw }
Register-Mock Remove-Item { return }
Register-Mock Test-Path { return $true }

try
{
    Invoke-SqlQueryDeployment -taskType "sqlQuery" -sqlFile "SampleFile.temp" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB"
}
catch
{
    # Do Nothing
}

Assert-WasCalled -Command Test-Path -Times 0
Assert-WasCalled -Command Remove-Item -Times 0
