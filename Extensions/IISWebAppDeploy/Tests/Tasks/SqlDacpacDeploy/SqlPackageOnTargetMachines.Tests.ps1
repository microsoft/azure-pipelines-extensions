$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptDirName = Split-Path -Leaf $currentScriptPath
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$sqlPackageOnTargetMachinesPath = "$currentScriptPath\..\..\..\Src\Tasks\$scriptDirName\TaskModuleSqlUtility\$sut"

if(-not (Test-Path -Path $sqlPackageOnTargetMachinesPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find MsDeployOnTargetMachines.ps1 at $sqlPackageOnTargetMachinesPath"
}

. "$sqlPackageOnTargetMachinesPath"

mkdir $currentScriptPath\SQL\110
mkdir $currentScriptPath\SQL\120

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

# Tests ----------------------------------------------------------------------------

Describe "Tests for verifying RunCommand functionality" {

    Context "When command execution fails" {

        $errMsg = "Command Execution Failed"
        Mock cmd.exe { throw $errMsg}
        
        try
        {
            $result = RunCommand -command "NonExisingCommand"
        }
        catch
        {
            $result = $_
        }
        
        It "should throw exception" {
            ($result.Exception.ToString().Contains("$errMsg")) | Should Be $true
        }
    }

    Context "When command execution successful" {
            
        try
        {
            $result = RunCommand -command "echo %cd%"
        }
        catch
        {
            $result = $_
        }
        
        It "should not throw exception" {
            $result.Exception | Should Be $null
        }
    }
}

Describe "Get-SqlPackageOnTargetMachine" {
    Context "SQLPackage does not exist on machine" {
        Mock LocateHighestVersionSqlPackageWithSql {return $null, 0 }
        Mock LocateHighestVersionSqlPackageWithDacMsi {return $null, 0 }
        Mock LocateHighestVersionSqlPackageInVS {return $null, 0 }
        It "Should throw" {
            { Get-SqlPackageOnTargetMachine } | Should Throw "Unable to find the location of Dac Framework (SqlPackage.exe) from registry on machine $env:COMPUTERNAME"
            
        }
    }

    Context "Highest Sql version from SQL server installation" {
        Mock LocateHighestVersionSqlPackageWithSql {return $testSQLServerDacInstallPath, "12.0" }
        Mock LocateHighestVersionSqlPackageWithDacMsi {return $testDacMsiDacInstallPath, "11.0" }
        Mock LocateHighestVersionSqlPackageInVS {return $testVsDacInstallPath, "11.0" }
        It "Should return Sql Server path for SqlPackage.exe" {
            $sqlPath = Get-SqlPackageOnTargetMachine
            $sqlPath | Should Be $testSQLServerDacInstallPath
        }
    }

    Context "Highest Sql version from Dac Fx installation" {
        Mock LocateHighestVersionSqlPackageWithSql {return $testSQLServerDacInstallPath, "11.0" }
        Mock LocateHighestVersionSqlPackageWithDacMsi {return $testDacMsiDacInstallPath, "12.0" }
        Mock LocateHighestVersionSqlPackageInVS {return $testVsDacInstallPath, "11.0" }
        It "Should return Sql Server path for SqlPackage.exe" {
            $sqlPath = Get-SqlPackageOnTargetMachine
            $sqlPath | Should Be $testDacMsiDacInstallPath
        }
    }

    Context "Highest Sql version from VS installation" {
        Mock LocateHighestVersionSqlPackageWithSql {return $testSQLServerDacInstallPath, "11.0" }
        Mock LocateHighestVersionSqlPackageWithDacMsi {return $testDacMsiDacInstallPath, "11.0" }
        Mock LocateHighestVersionSqlPackageInVS {return $testVsDacInstallPath, "12.0" }
        It "Should return Sql Server path for SqlPackage.exe" {
            $sqlPath = Get-SqlPackageOnTargetMachine
            $sqlPath | Should Be $testVsDacInstallPath
        }
    }
}

Describe "Get-SqlPackageForSqlVersion" {
    Context "Sql install path not found on the machine" {
        Mock Get-RegistryValueIgnoreError { return $null }
        It "Should return null if Sql Server is not present on machine" {
            $sqlPath = Get-SqlPackageForSqlVersion 110 $true 
            $sqlPath | Should Be $null
        }
    }

    Context "SqlPackage does not exist at install path on the machine for wow64 true" {
        Mock Get-RegistryValueIgnoreError { return $testDacPath } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $testdacInstallPath }
        It "Should return correct SQL path on the machine" {
            $sqlPath = Get-SqlPackageForSqlVersion 110 $true
            $sqlPath | Should Be $null
        }
    }

    Context "Sql install path exist on the machine for wow64 true" {
        Mock Get-RegistryValueIgnoreError { return $testDacPath } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testdacInstallPath }
        It "Should return correct SQL path on the machine" {
            $sqlPath = Get-SqlPackageForSqlVersion 110 $true
            $sqlPath | Should Be $testdacInstallPath
        }
    }

    Context "Sql install path exist on the machine for wow64 false" {
        Mock Get-RegistryValueIgnoreError { return $testDacPath64 } -ParameterFilter { $RegistryView -eq "Registry32" }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testdacInstallPath64 }
        It "Should return correct SQL path on the machine" {
            $sqlPath = Get-SqlPackageForSqlVersion 110 $false
            $sqlPath | Should Be $testdacInstallPath64
        }
    }
}

Describe "LocateHighestVersionSqlPackageWithSql" {
    Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlRegKey }
    Mock Get-Item  { return $testRegistryValue }
    Mock Get-SubKeysInFloatFormat { return $vsVersions }

    Context "Sql Server not present on the machine" {
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlRegKey }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlRegKey64 }
        It "Should return null if Sql Server is not present on machine" {
            $vsPath, $version = LocateHighestVersionSqlPackageWithSql 
            $vsPath | Should Be $null
            $version | Should Be 0
        }
    }

    Context "SQLPackage present in highest SQL server version in Wow64 node" {  
        Mock Get-SqlPackageForSqlVersion { return $testDacPath } -ParameterFilter { $MajorVersion -eq $vsVersion1 -and $Wow6432Node -eq $true }
        Mock Get-SqlPackageForSqlVersion { return $testDacPath64 } -ParameterFilter { $MajorVersion -eq $vsVersion1 -and $Wow6432Node -eq $false }
        It "Should return correct sql dacapc path and version from the highest version for wow64 node" {
            $vsPath, $version = LocateHighestVersionSqlPackageWithSql 
            $vsPath | Should Be $testDacPath
            $version | Should Be $vsVersion1
        }
    }

    Context "SQLPackage present in highest SQL server version not in Wow64 node" {  
        Mock Get-SqlPackageForSqlVersion { return $null } -ParameterFilter { $MajorVersion -eq $vsVersion1 -and $Wow6432Node -eq $true }
        Mock Get-SqlPackageForSqlVersion { return $testDacPath64 } -ParameterFilter { $MajorVersion -eq $vsVersion1 -and $Wow6432Node -eq $false }
        It "Should return correct sql dacapc path and version from the highest version not in wow64 node" {
            $vsPath, $version = LocateHighestVersionSqlPackageWithSql 
            $vsPath | Should Be $testDacPath64
            $version | Should Be $vsVersion1
        }
    }

    Context "SQLPackage present in second Sql Server version" {        
        Mock Get-SqlPackageForSqlVersion { return $null } -ParameterFilter { $MajorVersion -eq $vsVersion1 -and $Wow6432Node -eq $true }
        Mock Get-SqlPackageForSqlVersion { return $null } -ParameterFilter { $MajorVersion -eq $vsVersion1 -and $Wow6432Node -eq $false }        
        Mock Get-SqlPackageForSqlVersion { return $testDacPath } -ParameterFilter { $MajorVersion -eq $vsVersion2 -and $Wow6432Node -eq $true }
        Mock Get-SqlPackageForSqlVersion { return $testDacPath64 } -ParameterFilter { $MajorVersion -eq $vsVersion2 -and $Wow6432Node -eq $false }
        It "Should return correct sql dacapc path and version from the second version" {
            $vsPath, $version = LocateHighestVersionSqlPackageWithSql 
            $vsPath | Should Be $testDacPath
            $version | Should Be $vsVersion2
        }
    }

    Context "SQLPackage not present in any SQL version" {        
        Mock Get-SqlPackageForSqlVersion { return $null }         
        It "Should return null if SqlPackage not found in SQL server versions" {
            $vsPath, $version = LocateHighestVersionSqlPackageWithSql 
            $vsPath | Should Be $null
            $version | Should Be 0
        }
    }
}

Describe "LocateHighestVersionSqlPackageWithDacMsi" {
    Context "Dac Fx not present on the machine" {
        Mock Test-Path { return $false }        
        It "Should return null if Dac Fx is not present on machine" {
            $vsPath, $version = LocateHighestVersionSqlPackageWithDacMsi 
            $vsPath | Should Be $null
            $version | Should Be 0
        }
    }

    Context "Dac Fx present in Registry64 in Program Files(x86)" {
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKey }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKeyWow }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFxPathx86 }
        It "Should return correct sql dacapc path and version" {
            $sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
            $sqlDacPath | Should Be $testDacFxPathx86
            $sqlDacVersion | Should Be $testDacMajorVersion12Int
        }
    }

    Context "Dac Fx present in Registry64 in Program Files" {
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKey }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKeyWow }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $testDacFxPathx86 }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFxPath }
        It "Should return correct sql dacapc path and version" {
            $sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
            $sqlDacPath | Should Be $testDacFxPath
            $sqlDacVersion | Should Be $testDacMajorVersion12Int
        }
    }

    Context "Dac Fx present in Registry32 in Program Files(x86)" {
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKey }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKeyWow }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKey2016 }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKeyWow2016 }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ParameterFilter { $RegistryView -eq "Registry32" }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFxPathx86 }
        It "Should return correct sql dacapc path and version" {
            $sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
            $sqlDacPath | Should Be $testDacFxPathx86
            $sqlDacVersion | Should Be $testDacMajorVersion12Int
        }
    }

    Context "Dac Fx present in Registry32 in Program Files" {
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKey }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKeyWow }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKey2016 }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $sqlDacRegKeyWow2016 }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ParameterFilter { $RegistryView -eq "Registry32" }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $testDacFxPathx86 }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFxPath }
        It "Should return correct sql dacapc path and version" {
            $sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
            $sqlDacPath | Should Be $testDacFxPath
            $sqlDacVersion | Should Be $testDacMajorVersion12Int
        }
    }

    Context "Dac Fx present in Registry64 has higher version" {
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKey }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKeyWow }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion11 } -ParameterFilter { $RegistryView -eq "Registry32" }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $testDacFxPathx86 }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFxPath }
        It "Should return correct sql dacapc path and version" {
            $sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
            $sqlDacPath | Should Be $testDacFxPath
            $sqlDacVersion | Should Be $testDacMajorVersion12Int
        }
    }

    Context "Dac Fx present in Registry32 has higher version" {
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKey }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $sqlDacRegKeyWow }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion11 } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Get-RegistryValueIgnoreError { return $testDacMajorVersion12 } -ParameterFilter { $RegistryView -eq "Registry32" }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $testDacFxPathx86 }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFxPath }
        It "Should return correct sql dacapc path and version" {
            $sqlDacPath, $sqlDacVersion = LocateHighestVersionSqlPackageWithDacMsi
            $sqlDacPath | Should Be $testDacFxPath
            $sqlDacVersion | Should Be $testDacMajorVersion12Int
        }
    }
}

Describe "LocateSqlPackageInVS" {
    Context "Visual Studio not present on the machine" {
        Mock Get-RegistryValueIgnoreError { return $null }
        It "Should return null if VS is not present on machine" {
            $vsPath, $version = LocateSqlPackageInVS 15.0
            $vsPath | Should Be $null
            $version | Should Be 0
        }
    }

    Context "Visual Studio does not contain Dac framework" {
        Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $testDacParentDir }        
        It "Should return correct sql dacapc path and version" {
            $vsPath, $version = LocateSqlPackageInVS 15.0
            $vsPath | Should Be $null
            $version | Should Be 0
        }
    }

    Context "Visual Studio contains SQLPackage" {
        Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacParentDir }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFullPathHigher }
        Mock Get-ChildItem { return $testDacVersionDirs } -ParameterFilter { $Path -eq $testDacParentDir }
        It "Should return correct sql dacapc path and version" {
            $vsPath, $version = LocateSqlPackageInVS 15.0
            $vsPath | Should Be $testDacFullPathHigher
            $version | Should Be $testDacVersionHigher
        }
    }

    Context "Visual Studio contains SQLPackage in Registry32" {
        Mock Get-RegistryValueIgnoreError { return $null } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ParameterFilter { $RegistryView -eq "Registry32" }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacParentDir }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFullPathHigher }
        Mock Get-ChildItem { return $testDacVersionDirs } -ParameterFilter { $Path -eq $testDacParentDir }
        It "Should return correct sql dacapc path and version" {
            $vsPath, $version = LocateSqlPackageInVS 15.0
            $vsPath | Should Be $testDacFullPathHigher
            $version | Should Be $testDacVersionHigher
        }
    }

    Context "Visual Studio contains SQLPackage but in lower version" {
        Mock Get-RegistryValueIgnoreError { return $testVsInstallDir } -ParameterFilter { $RegistryView -eq "Registry64" }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacParentDir }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $testDacFullPathHigher }
        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $testDacFullPathLower }
        Mock Get-ChildItem { return $testDacVersionDirs } -ParameterFilter { $Path -eq $testDacParentDir }
        It "Should return correct sql dacapc path and version" {
            $vsPath, $version = LocateSqlPackageInVS 15.0
            $vsPath | Should Be $testDacFullPathLower
            $version | Should Be $testDacVersionLower
        }
    }
}

Describe "LocateHighestVersionSqlPackageInVS" {
    Mock Test-Path { return $true } -ParameterFilter { $Path -eq $vsRegKey }
    Mock Get-Item  { return $testRegistryValue }
    Mock Get-SubKeysInFloatFormat { return $vsVersions }

    Context "Visual Studio not present on the machine" {
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $vsRegKey }
        Mock Test-Path { return $false } -ParameterFilter { $Path -eq $vsRegKey64 }
        It "Should return null if VS is not present on machine" {
            $vsPath, $version = LocateHighestVersionSqlPackageInVS 
            $vsPath | Should Be $null
            $version | Should Be 0
        }
    }

    Context "SQLPackage present in first VS version" {  
        Mock LocateSqlPackageInVS { return $testDacPath, $dacVersionOut } -ParameterFilter {$Version -eq $vsVersion1}
        It "Should return correct sql dacapc path and version from the first version" {
            $vsPath, $version = LocateHighestVersionSqlPackageInVS 
            $vsPath | Should Be $testDacPath
            $version | Should Be $dacVersionOut
        }
    }

    Context "SQLPackage present in second VS version" {
        Mock LocateSqlPackageInVS { return $null, 0 } -ParameterFilter {$Version -eq $vsVersion1}
        Mock LocateSqlPackageInVS { return $testDacPath, $dacVersionOut } -ParameterFilter {$Version -eq $vsVersion2}
        It "Should return correct sql dacapc path and version from the second version" {
            $vsPath, $version = LocateHighestVersionSqlPackageInVS 
            $vsPath | Should Be $testDacPath
            $version | Should Be $dacVersionOut
        }
    }

    Context "SQLPackage not present in any VS version" {
        Mock LocateSqlPackageInVS { return $null, 0 } -ParameterFilter {$Version -eq $vsVersion1}
        Mock LocateSqlPackageInVS { return $null, 0 } -ParameterFilter {$Version -eq $vsVersion2}
        Mock LocateSqlPackageInVS { return $null, 0 } -ParameterFilter {$Version -eq $vsVersion3}
        It "Should return null if SqlPackage not found in VS" {
            $vsPath, $version = LocateHighestVersionSqlPackageInVS 
            $vsPath | Should Be $null
            $version | Should Be 0
        }
    }
}

Describe "Tests for Get-SqlPackageCmdArgs functionality" {

    Context "When target method is server and with windows authentication" {

        $cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "windowsAuthentication"

        It "Should contain targetmethod as server and no sqluser argument should be present" {
            ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish /TargetServerName:"localhost" /TargetDatabaseName:"SampleDB"')) | Should Be $true
            ($cmdArgs.Contains('/TargetUser:"dummyuser" /TargetPassword:"dummypassword"')) | Should Be $false
        }
    }

    Context "When target method is server and with mixed mode authentication" {

        $secureAdminPassword =  ConvertTo-SecureString "dummypassword" -AsPlainText -Force
        $psCredential = New-Object System.Management.Automation.PSCredential ("dummyuser", $secureAdminPassword)
        $cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlServerCredentials $psCredential

        It "Should contain targetmethod as server and sqluser argument should be present" {
            ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish /TargetServerName:"localhost" /TargetDatabaseName:"SampleDB"')) | Should Be $true
            ($cmdArgs.Contains('/TargetUser:"dummyuser" /TargetPassword:"dummypassword"')) | Should Be $true
        }
    }

    Context "When target method is connectionString" {
        
        $cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -targetMethod "connectionString" -connectionString "dummyconnectionString"

        It "Should contain targetmethod as server and sqluser argument should be present" {
            ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish /TargetConnectionString:"dummyconnectionString"')) | Should Be $true
        }
    }
    
    Context "When publish profile setting is provided" {
        
        $cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -publishProfile "dummypublish.xml"

        It "Should contain targetmethod as server and sqluser argument should be present" {
            ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish')) | Should Be $true
            ($cmdArgs.Contains('/Profile:"dummypublish.xml"')) | Should Be $true
        }
    }

}

Describe "Tests for verifying Execute-DacpacDeployment functionality" {

    Context "When execute DacpacDeployment is invoked with all inputs"{

        Mock Get-SqlPackageOnTargetMachine { return "sqlpackage.exe" }
        Mock Get-SqlPackageCmdArgs -Verifiable { return "args" } -ParameterFilter { $DacpacFile -eq "sample.dacpac" }
        Mock RunCommand -Verifiable { return } -ParameterFilter {$Command -eq "`"sqlpackage.exe`" args"}

        Execute-DacpacDeployment -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost"

        It "Should deploy dacpac file"{
            Assert-VerifiableMocks
            Assert-MockCalled  Get-SqlPackageOnTargetMachine -Times 1
        }
    }
}

if(Test-Path $currentScriptPath\SQL)
{
    Remove-Item $currentScriptPath\SQL -Force -Recurse
}