[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

## TODO: raagra: Fix this test
# Test 1: Should return null if VS is not present on machine, Visual Studio not present on the machine
# Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $vsRegKey }
# Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $vsRegKey64 }
# Register-Mock Find-VSWhere { return $null }
# $vsPath, $version = LocateHighestVersionSqlPackageInVS 
# Assert-IsNullOrEmpty $vsPath
# Assert-AreEqual $version 0

# Unregister-Mock Test-Path
# Unregister-Mock Find-VSWhere

# Test 2: Should return correct sql dacapc path and version from the first version, SQLPackage present in first VS version
Register-Mock LocateSqlPackageInVS { return $testDacPath, $dacVersionOut } -ArgumentsEvaluator {$args[0] -eq $vsVersion1}
# Register-Mock LocateSqlPackageInVS { return $testDacPath, $dacVersionOut } -ArgumentsEvaluator {$args[0] -eq $vsVersion1}
# Register-Mock Find-VSWhere { return $null }
# $vsPath, $version = LocateHighestVersionSqlPackageInVS 
# Assert-AreEqual $vsPath $testDacPath
# Assert-AreEqual $version $dacVersionOut

# Unregister-Mock LocateSqlPackageInVS
# Unregister-Mock Find-VSWhere

# Test 3: Should return correct sql dacapc path and version from the second version, SQLPackage present in second VS version
Register-Mock LocateSqlPackageInVS { return $null, 0 } -ArgumentsEvaluator {$args[0] -eq $vsVersion1}
Register-Mock LocateSqlPackageInVS { return $testDacPath, $dacVersionOut } -ArgumentsEvaluator {$args[0] -eq $vsVersion2}
Register-Mock Find-VSWhere { return $null }
$vsPath, $version = LocateHighestVersionSqlPackageInVS 
Assert-AreEqual $vsPath $testDacPath
Assert-AreEqual $version $dacVersionOut

Unregister-Mock LocateSqlPackageInVS
Unregister-Mock Find-VSWhere

# Test 4: Should return null if SqlPackage not found in VS, SQLPackage not present in any VS version
Register-Mock LocateSqlPackageInVS { return $null, 0 } -ArgumentsEvaluator {$args[0] -eq $vsVersion1}
Register-Mock LocateSqlPackageInVS { return $null, 0 } -ArgumentsEvaluator {$args[0] -eq $vsVersion2}
Register-Mock LocateSqlPackageInVS { return $null, 0 } -ArgumentsEvaluator {$args[0] -eq $vsVersion3}
Register-Mock Find-VSWhere { return $null }
$vsPath, $version = LocateHighestVersionSqlPackageInVS 
Assert-IsNullOrEmpty $vsPath
Assert-AreEqual $version 0
