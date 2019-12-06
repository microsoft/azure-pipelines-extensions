[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

# Test 1: Should return null if Dac Fx is not present on machine, Dac Fx not present on the machine
Register-Mock Test-Path { return $false }        
$vsPath, $version = LocateHighestVersionSqlPackageWithDacMsi 
Assert-IsNullOrEmpty $vsPath
Assert-AreEqual $version 0

Unregister-Mock Test-Path

# Test 2: Should return correct sql dacapc path and version, Dac Fx present in Registry64 in Program Files(x86)
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFxPathx86 }
$sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
Assert-AreEqual $sqlDacPath $testDacFxPathx86
Assert-AreEqual $sqlDacVersion $testDacMajorVersion12Int

Unregister-Mock Test-Path
Unregister-Mock Get-RegistryValueIgnoreError

# Test 3: Should return correct sql dacapc path and version, Dac Fx present in Registry64 in Program Files
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $testDacFxPathx86 }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFxPath }
$sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
Assert-AreEqual $sqlDacPath $testDacFxPath
Assert-AreEqual $sqlDacVersion $testDacMajorVersion12Int

Unregister-Mock Test-Path
Unregister-Mock Get-RegistryValueIgnoreError

# Test 4: Should return correct sql dacapc path and version, Dac Fx present in Registry32 in Program Files(x86)
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey2016 }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow2016 }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ArgumentsEvaluator { $args[3] -eq "Registry32" }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFxPathx86 }
$sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
Assert-AreEqual $sqlDacPath $testDacFxPathx86
Assert-AreEqual $sqlDacVersion $testDacMajorVersion12Int

Unregister-Mock Test-Path
Unregister-Mock Get-RegistryValueIgnoreError

# Test 5: Should return correct sql dacapc path and version, Dac Fx present in Registry32 in Program Files
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey2016 }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow2016 }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ArgumentsEvaluator { $args[3] -eq "Registry32" }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $testDacFxPathx86 }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFxPath }
$sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
Assert-AreEqual $sqlDacPath $testDacFxPath
Assert-AreEqual $sqlDacVersion $testDacMajorVersion12Int

Unregister-Mock Test-Path
Unregister-Mock Get-RegistryValueIgnoreError

# Test 6: Should return correct sql dacapc path and version, Dac Fx present in Registry64 has higher version
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion11 } -ArgumentsEvaluator { $args[3] -eq "Registry32" }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $testDacFxPathx86 }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFxPath }
$sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
Assert-AreEqual $sqlDacPath $testDacFxPath
Assert-AreEqual $sqlDacVersion $testDacMajorVersion12Int

Unregister-Mock Test-Path
Unregister-Mock Get-RegistryValueIgnoreError

# Test 7: Should return correct sql dacapc path and version, Dac Fx present in Registry32 has higher version
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKey }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $sqlDacRegKeyWow }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion11 } -ArgumentsEvaluator { $args[3] -eq "Registry64" }
Register-Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ArgumentsEvaluator { $args[3] -eq "Registry32" }
Register-Mock Test-Path { return $false } -ArgumentsEvaluator { $args[0] -eq $testDacFxPathx86 }
Register-Mock Test-Path { return $true } -ArgumentsEvaluator { $args[0] -eq $testDacFxPath }
$sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
Assert-AreEqual $sqlDacPath $testDacFxPath
Assert-AreEqual $sqlDacVersion $testDacMajorVersion12Int
