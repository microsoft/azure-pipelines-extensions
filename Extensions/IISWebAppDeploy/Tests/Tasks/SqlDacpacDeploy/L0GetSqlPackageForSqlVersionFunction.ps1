[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

# Test 1: Should return null if Sql Server is not present on machine, Sql install path not found on the machine
Register-Mock Get-RegistryValueIgnoreError { return $null }
$sqlPath = Get-SqlPackageForSqlVersion 110 $true 
Assert-IsNullOrEmpty $sqlPath

Unregister-Mock Get-RegistryValueIgnoreError

# Test 2: Should return correct SQL path on the machine, SqlPackage does not exist at install path on the machine for wow64 true
Register-Mock Get-RegistryValueIgnoreError { return $testDacPath } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $testdacInstallPath }
$sqlPath = Get-SqlPackageForSqlVersion 110 $true
Assert-IsNullOrEmpty $sqlPath

Unregister-Mock Get-RegistryValueIgnoreError
Unregister-Mock Test-Path

# Test 3: Should return correct SQL path on the machine, Sql install path exist on the machine for wow64 true
Register-Mock Get-RegistryValueIgnoreError { return $testDacPath } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testdacInstallPath }
$sqlPath = Get-SqlPackageForSqlVersion 110 $true
Assert-AreEqual $sqlPath $testdacInstallPath

Unregister-Mock Get-RegistryValueIgnoreError
Unregister-Mock Test-Path

# Test 4: Should return correct SQL path on the machine, Sql install path exist on the machine for wow64 false
Register-Mock Get-RegistryValueIgnoreError { return $testDacPath64 } -ArgumentsEvaluator { $args[3] -eq "Registry32" }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testdacInstallPath64 }
$sqlPath = Get-SqlPackageForSqlVersion 110 $false
Assert-AreEqual $sqlPath $testdacInstallPath64
