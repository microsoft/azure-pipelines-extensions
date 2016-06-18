$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$scritpDirName = Split-Path -Leaf $currentScriptPath
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$deployIISWebAppPath = "$currentScriptPath\..\..\..\Src\Tasks\$scritpDirName\$sut"

if(-not (Test-Path -Path $deployIISWebAppPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find DeployIISWebApp.ps1 at $deployIISWebAppDirectoryPath"
}

$invokeRemoteDeploymentPath = "$currentScriptPath\..\..\..\Src\Tasks\$scritpDirName\DeploymentSDK\InvokeRemoteDeployment.ps1"


if(-not (Test-Path -Path $invokeRemoteDeploymentPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find InvokeRemoteDeployment.ps1 at $invokeRemoteDeploymentPath"
}

#Adding Import-Module dummy implementation for testability purpose
function Import-Module
{
    Write-Verbose "Dummy Import-Module" -Verbose
}

. "$deployIISWebAppPath"
. "$invokeRemoteDeploymentPath"

Describe "Tests for testing Trim-Inputs functionality" {

    $pkgNoExtraQuotes = "webdeploy.zip"
    $paramfileNoExtraQuotes = "paramfile.xml"
    $siteNoExtraQuotes = "website"
    $adminUserNoSpaces = "adminuser"

    Context "Should remove extra quotes for all inputs except usernames " {

        $pkg = "`"webdeploy.zip`""
        $paramfile = "`"paramfile.xml`""
        $site = "`"website`""

        Trim-Inputs -package ([ref]$pkg) -paramFile ([ref]$paramfile) -siteName ([ref]$site) -adminUser ([ref]$adminUserNoSpaces)

        It "should not have extra double quotes"{
            ( $pkg ) | Should Be $pkgNoExtraQuotes
            ( $paramfile ) | Should Be $paramfileNoExtraQuotes
            ( $site ) | Should Be $siteNoExtraQuotes
        }
    }

    Context "Should remove extra spaces for adminUserName" {
        $adminUser = " adminuser "

        Trim-Inputs -package ([ref]$pkgNoExtraQuotes) -paramFile ([ref]$paramfileNoExtraQuotes) -siteName ([ref]$siteNoExtraQuotes) -adminUser ([ref]$adminUser)

        It "should not have extra double quotes"{
            ( $adminUser ) | Should Be $adminUserNoSpaces
        }
    }
}

Describe "Tests for testing Escape-DoubleQuotes functionality" {

    Context "When input string contains double quote character" {

        It "Should add powershell escape character for double quotes" {
            (Escape-DoubleQuotes -str 'StringWithDouble"Quotes') | Should Be 'StringWithDouble`"Quotes'
        }
    }
}

Describe "Tests for testing Get-ScriptToRun functionality" {
    Context "Should contain msdeploy on remote machines script and invoke expression at the end" {

        Mock Get-Content {return "Dummy Script"}

        $script = Get-ScriptToRun -webDeployPackage "pkg.zip" -webDeployParamFile "" -overRideParams "" -websiteName "Sample`"Web" -removeAdditionalFiles "false" -excludeFilesFromAppData "true" -takeAppOffline "true"

        It "should contain script content and invoke expression" {
            ($script.Contains('Dummy Script')) | Should Be $true
            ($script.Contains('Execute-Main -WebDeployPackage "pkg.zip" -WebDeployParamFile "" -OverRideParams "" -WebsiteName "Sample`"Web -RemoveAdditionalFiles false -ExcludeFilesFromAppData true -TakeAppOffline true')) | Should Be $true
        }
    }
}

Describe "Tests for testing Run-RemoteDeployment" {
    
    $machinesList = "dummyMachinesList"
    $script = "dummyscript"
    $deployInParallel = "true"
    $adminUserName = "dummyuser"
    $adminPassword = "dummypassword"
    $http = "http"
    $https = "https"
    $filter = "dummyFilter"


    Context "On successful execution of remote deployment script" {

        Mock Invoke-RemoteDeployment -Verifiable { return "" } -ParameterFilter { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}
        
        try
        {
            $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
        }
        catch
        {
            $result = $_
        }

        It "Should not throw any exception" {
            $result.Exception | Should Be $null
            Assert-VerifiableMocks
        }
    }

    Context "Should throw on failure of remote execution" {
        
        Mock Invoke-RemoteDeployment -Verifiable { return "Error occurred" } -ParameterFilter { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}

        $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel 2>&1 | Out-String

        It "Should throw exception on failure" {
            ($result.Contains('Error occurred')) | Should Be $true
            Assert-VerifiableMocks
        }

    }
}

Describe "Tests for testing Main functionality" {
    Context "Should integrate all the functions and call with appropriate arguments" {

        Mock Get-Content -Verifiable {return "dummyscript"}
        Mock Invoke-RemoteDeployment -Verifiable { return "" } -ParameterFilter { $MachinesList -eq "dummyMachinesList" }

        Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -webDeployPackage "pkg.zip" -webDeployParamFile "param.xml" -overRideParams "dummyoverride" -websiteName "dummyweb"

        It "Should integrate all the functions and call with appropriate arguments" {
            Assert-VerifiableMocks
        }
    }
}

