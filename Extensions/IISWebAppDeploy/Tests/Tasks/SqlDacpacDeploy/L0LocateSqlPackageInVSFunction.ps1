[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

# Test 1: Should return null if VS is not present on machine, Visual Studio not present on the machine
Register-Mock Get-RegistryValueIgnoreError { return $null }
Register-Mock Find-VSWhere { return $null }
$vsPath, $version = LocateSqlPackageInVS 15.0
Assert-IsNullOrEmpty $vsPath
Assert-AreEqual $version 0

Unregister-Mock Get-RegistryValueIgnoreError

# Test 2: Should return correct sql dacapc path and version, Visual Studio does not contain Dac framework
Register-Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $testDacParentDir }        
$vsPath, $version = LocateSqlPackageInVS 15.0
Assert-IsNullOrEmpty $vsPath
Assert-AreEqual $version 0

Unregister-Mock Get-RegistryValueIgnoreError
Unregister-Mock Test-Path

# Test 3: Should return correct sql dacapc path and version, Visual Studio contains SQLPackage
Register-Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacParentDir }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFullPathHigher }
Register-Mock Get-ChildItem { return $testDacVersionDirs } -ArgumentsEvaluator { $args[0] -eq $testDacParentDir }
$vsPath, $version = LocateSqlPackageInVS 15.0
Assert-AreEqual $vsPath $testDacFullPathHigher
Assert-AreEqual $version $testDacVersionHigher

Unregister-Mock Get-RegistryValueIgnoreError
Unregister-Mock Test-Path
Unregister-Mock Get-ChildItem

# Test 4: Should return correct sql dacapc path and version, Visual Studio contains SQLPackage in Registry32
Register-Mock Get-RegistryValueIgnoreError { return $null } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ArgumentsEvaluator { $args[3] -eq "Registry32" }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacParentDir }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFullPathHigher }
Register-Mock Get-ChildItem { return $testDacVersionDirs } -ArgumentsEvaluator { $args[0] -eq $testDacParentDir }
$vsPath, $version = LocateSqlPackageInVS 15.0
Assert-AreEqual $vsPath $testDacFullPathHigher
Assert-AreEqual $version $testDacVersionHigher

Unregister-Mock Get-RegistryValueIgnoreError
Unregister-Mock Test-Path
Unregister-Mock Get-ChildItem

# Test 5: Should return correct sql dacapc path and version, Visual Studio contains SQLPackage but in lower version
Register-Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacParentDir }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $testDacFullPathHigher }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFullPathLower }
Register-Mock Get-ChildItem { return $testDacVersionDirs } -ArgumentsEvaluator { $args[0] -eq $testDacParentDir }
$vsPath, $version = LocateSqlPackageInVS 15.0
Assert-AreEqual $vsPath $testDacFullPathLower
Assert-AreEqual $version $testDacVersionLower

