[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

## TODO: raagra: Fix this test
# Test 1: Should return null if Sql Server is not present on machine, Sql Server not present on the machine
# Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlRegKey }
# Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlRegKey64 }
# $vsPath, $version = LocateHighestVersionSqlPackageWithSql 
# Assert-IsNullOrEmpty $vsPath
# Assert-AreEqual $version 0

# Unregister-Mock TestPath

# Test 2: Should return correct sql dacapc path and version from the highest version for wow64 node, SQLPackage present in highest SQL server version in Wow64 node
Register-Mock Get-SqlPackageForSqlVersion { return $testDacPath } -ArgumentsEvaluator { $args[0] -eq $sqlVersion1 -and $args[1] -eq $true }
Register-Mock Get-SqlPackageForSqlVersion { return $testDacPath64 } -ArgumentsEvaluator { $args[0] -eq $sqlVersion1 -and $args[1] -eq $false }
$vsPath, $version = LocateHighestVersionSqlPackageWithSql 
Assert-AreEqual $vsPath $testDacPath
Assert-AreEqual $version $sqlVersion1

Unregister-Mock TestPath
Unregister-Mock Get-SqlPackageForSqlVersion

# Test 3: Should return correct sql dacapc path and version from the highest version not in wow64 node, SQLPackage present in highest SQL server version not in Wow64 node
Register-Mock Get-SqlPackageForSqlVersion { return $null } -ArgumentsEvaluator { $args[0] -eq $sqlVersion1 -and $args[1] -eq $true }
Register-Mock Get-SqlPackageForSqlVersion { return $testDacPath64 } -ArgumentsEvaluator { $args[0] -eq $sqlVersion1 -and $args[1] -eq $false }
$vsPath, $version = LocateHighestVersionSqlPackageWithSql 
Assert-AreEqual $vsPath $testDacPath64
Assert-AreEqual $version $sqlVersion1

Unregister-Mock TestPath
Unregister-Mock Get-SqlPackageForSqlVersion

# Test 4: Should return correct sql dacapc path and version from the second version, SQLPackage present in second Sql Server version
Register-Mock Get-SqlPackageForSqlVersion { return $null } -ArgumentsEvaluator { $args[0] -eq $sqlVersion1 -and $args[1] -eq $true }
Register-Mock Get-SqlPackageForSqlVersion { return $null } -ArgumentsEvaluator { $args[0] -eq $sqlVersion1 -and $args[1] -eq $false }        
Register-Mock Get-SqlPackageForSqlVersion { return $testDacPath } -ArgumentsEvaluator { $args[0] -eq $sqlVersion2 -and $args[1] -eq $true }
Register-Mock Get-SqlPackageForSqlVersion { return $testDacPath64 } -ArgumentsEvaluator { $args[0] -eq $sqlVersion2 -and $args[1] -eq $false }
$vsPath, $version = LocateHighestVersionSqlPackageWithSql 
Assert-AreEqual $vsPath $testDacPath
Assert-AreEqual $version $sqlVersion2

Unregister-Mock TestPath
Unregister-Mock Get-SqlPackageForSqlVersion

# Test 5: Should return null if SqlPackage not found in SQL server versions, SQLPackage not present in any SQL version
Register-Mock Get-SqlPackageForSqlVersion { return $null }         
$vsPath, $version = LocateHighestVersionSqlPackageWithSql 
Assert-IsNullOrEmpty $vsPath
Assert-AreEqual $version 0
