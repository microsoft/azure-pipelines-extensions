. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\SqlDacpacDeploy\TaskModuleSqlUtility\SqlPackageOnTargetMachines.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\Utility.ps1

mkdir C:\SQL\110 -Force
mkdir C:\SQL\120 -Force

# Constants ------------------------------------------------------------------------

# Script Constants ----------
$sqlRegKey = "HKLM:", "SOFTWARE", "Wow6432Node", "Microsoft", "Microsoft SQL Server" -join [System.IO.Path]::DirectorySeparatorChar
$sqlRegKey64 = "HKLM:", "SOFTWARE", "Microsoft", "Microsoft SQL Server" -join [System.IO.Path]::DirectorySeparatorChar
$vsRegKey = "HKLM:", "SOFTWARE", "Wow6432Node", "Microsoft", "VisualStudio" -join [System.IO.Path]::DirectorySeparatorChar
$vsRegKey64 = "HKLM:", "SOFTWARE", "Microsoft", "VisualStudio" -join [System.IO.Path]::DirectorySeparatorChar
$sqlDacRegKeyWow = "HKLM:", "SOFTWARE", "Wow6432Node", "Microsoft", "Microsoft SQL Server", "DACFramework", "CurrentVersion" -join [System.IO.Path]::DirectorySeparatorChar
$sqlDacRegKey = "HKLM:", "SOFTWARE", "Microsoft", "Microsoft SQL Server", "DACFramework", "CurrentVersion" -join [System.IO.Path]::DirectorySeparatorChar
$sqlDacRegKeyWow2016 = "HKLM:", "SOFTWARE", "Wow6432Node", "Microsoft", "Microsoft SQL Server", "Data-Tier Application Framework" -join [System.IO.Path]::DirectorySeparatorChar
$sqlDacRegKey2016 = "HKLM:", "SOFTWARE", "Microsoft", "Microsoft SQL Server", "Data-Tier Application Framework" -join [System.IO.Path]::DirectorySeparatorChar
$sqlVersion1 = "130"
$sqlVersion2 = "110"
$dacExtensionPath = [System.IO.Path]::Combine("Extensions", "Microsoft", "SQLDB", "DAC")


# Input ---------------------

$testRegistryPath = "HKLM:", "SOFTWARE", "Microsoft", "VisualStudio" -join [System.IO.Path]::DirectorySeparatorChar
$testRegistryValue = Get-Item $testRegistryPath

    # Get-SqlPackageOnTargetMachine
$testVsDacInstallPath = "C:\VS"
$testSQLServerDacInstallPath = "C:\SQL"
$testDacMsiDacInstallPath = "C:\DAC"

    # LocateSqlPackageInVS
$testVsInstallDir = "C:\test"
$testDacParentDir = [System.IO.Path]::Combine($testVsInstallDir, $dacExtensionPath)
$testDacVersionDirs = Get-ChildItem $currentScriptPath\SQL | Sort-Object @{e={$_.Name -as [int]}} -Descending
$testDacVersionDirHigher = $testDacVersionDirs[0]
$testDacVersionDirLower = $testDacVersionDirs[1]

    # LocateHighestVersionSqlPackageWithDacMsi 
$testDacMajorVersion11 = "11.0"
$testDacMajorVersion12 = "12.0"
$testDacMajorVersion11Int = "110"
$testDacMajorVersion12Int = "120"
$testDacFxPathx86 = ${env:ProgramFiles(x86)}, "Microsoft SQL Server", "$testDacMajorVersion12Int", "DAC", "bin", "SqlPackage.exe" -join [System.IO.Path]::DirectorySeparatorChar
$testDacFxPath = $env:ProgramFiles, "Microsoft SQL Server", "$testDacMajorVersion12Int", "DAC", "bin", "SqlPackage.exe" -join [System.IO.Path]::DirectorySeparatorChar

# Output --------------------
$vsVersion1 = "15.0"
$vsVersion2 = "14.0"
$vsVersion3 = "12.0"
$vsVersions = @($vsVersion1, $vsVersion2, $vsVersion3)
$testDacPath = "C:\test"
$testDacPath64 = "C:\test64"
$testdacInstallPath = [System.IO.Path]::Combine($testDacPath, "Dac", "bin", "SqlPackage.exe")
$testdacInstallPath64 = [System.IO.Path]::Combine($testDacPath64, "Dac", "bin", "SqlPackage.exe")
$dacVersionOut = 120
$testDacVersionHigher = $testDacVersionDirHigher.Name
$testDacFullPathHigher = [System.IO.Path]::Combine($testDacVersionDirHigher.FullName, "SqlPackage.exe")
$testDacVersionLower = $testDacVersionDirLower.Name
$testDacFullPathLower = [System.IO.Path]::Combine($testDacVersionDirLower.FullName, "SqlPackage.exe")

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }