[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

# Test 1: Should throw, SQLPackage does not exist on machine
Register-Mock LocateHighestVersionSqlPackageWithSql {return $null, 0 }
Register-Mock LocateHighestVersionSqlPackageWithDacMsi {return $null, 0 }
Register-Mock LocateHighestVersionSqlPackageInVS {return $null, 0 }

Assert-Throws { Get-SqlPackageOnTargetMachine } "Unable to find the location of Dac Framework (SqlPackage.exe) from registry on machine $env:COMPUTERNAME"

Unregister-Mock LocateHighestVersionSqlPackageWithSql
Unregister-Mock LocateHighestVersionSqlPackageWithDacMsi
Unregister-Mock LocateHighestVersionSqlPackageInVS

# Test 2: Should return Sql Server path for SqlPackage.exe, Highest Sql version from SQL server installation
Register-Mock LocateHighestVersionSqlPackageWithSql {return $testSQLServerDacInstallPath, "12.0" }
Register-Mock LocateHighestVersionSqlPackageWithDacMsi {return $testDacMsiDacInstallPath, "11.0" }
Register-Mock LocateHighestVersionSqlPackageInVS {return $testVsDacInstallPath, "11.0" }

$sqlPath = Get-SqlPackageOnTargetMachine
Assert-AreEqual $sqlPath $testSQLServerDacInstallPath

Unregister-Mock LocateHighestVersionSqlPackageWithSql
Unregister-Mock LocateHighestVersionSqlPackageWithDacMsi
Unregister-Mock LocateHighestVersionSqlPackageInVS

# Test 3: Should return Sql Server path for SqlPackage.exe, Highest Sql version from Dac Fx installation
Register-Mock LocateHighestVersionSqlPackageWithSql {return $testSQLServerDacInstallPath, "11.0" }
Register-Mock LocateHighestVersionSqlPackageWithDacMsi {return $testDacMsiDacInstallPath, "12.0" }
Register-Mock LocateHighestVersionSqlPackageInVS {return $testVsDacInstallPath, "11.0" }

$sqlPath = Get-SqlPackageOnTargetMachine
Assert-AreEqual $sqlPath $testDacMsiDacInstallPath

Unregister-Mock LocateHighestVersionSqlPackageWithSql
Unregister-Mock LocateHighestVersionSqlPackageWithDacMsi
Unregister-Mock LocateHighestVersionSqlPackageInVS

# Test 4: Should return Sql Server path for SqlPackage.exe, Highest Sql version from VS installation
Register-Mock LocateHighestVersionSqlPackageWithSql {return $testSQLServerDacInstallPath, "11.0" }
Register-Mock LocateHighestVersionSqlPackageWithDacMsi {return $testDacMsiDacInstallPath, "11.0" }
Register-Mock LocateHighestVersionSqlPackageInVS {return $testVsDacInstallPath, "12.0" }

$sqlPath = Get-SqlPackageOnTargetMachine
Assert-AreEqual $sqlPath $testVsDacInstallPath
