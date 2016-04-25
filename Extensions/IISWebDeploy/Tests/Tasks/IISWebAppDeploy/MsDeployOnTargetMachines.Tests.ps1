$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$scritpDirName = Split-Path -Leaf $currentScriptPath
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$msDeployOnTargetMachinesPath = "$currentScriptPath\..\..\..\Src\Tasks\$scritpDirName\$sut"

if(-not (Test-Path -Path $msDeployOnTargetMachinesPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find MsDeployOnTargetMachines.ps1 at $msDeployOnTargetMachinesDirectoryPath"
}

. "$msDeployOnTargetMachinesPath"

Describe "Tests for verifying Run-Command functionality"{

    Context "When command execution fails" {

        $errMsg = "Command Execution Failed"
        Mock cmd.exe { throw $errMsg}
        
        try
        {
            $result = Run-Command -command "NonExisingCommand"
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
            $result = Run-Command -command "echo %cd%"
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

Describe "Tests for verifying Get-MsDeployLocation functionality" {

    $msDeployNotFoundError = "Cannot find MsDeploy.exe location. Verify MsDeploy.exe is installed on $env:ComputeName and try operation again."
    Context "Get-ChildItem for fetching MsDeploy location, returns non-existing path" {

        $regKeyWithNoInstallPath = "HKLM:\SOFTWARE\Microsoft"
                
        It "Should throw exception" {
            { Get-MsDeployLocation -regKeyPath $regKeyWithNoInstallPath } | Should Throw
        }
    }

    Context "Get-ChildItem for fails as MsDeploy not installed on the machine" {
            
        $inValidInstallPathRegKey = "HKLM:\SOFTWARE\Microsoft\IIS Extensions\Invalid"

        It "Should throw exception" {
            { Get-MsDeployLocation -regKeyPath $inValidInstallPathRegKey } | Should Throw $msDeployNotFoundError
        }
    }
}

Describe "Tests for verifying Get-MsDeployCmdArgs functionality" {

    $webDeployPackage = "WebAppPackage.zip"
    $webDeployParamFile = "webDeployParamFile.xml"
    $overRideParams = "Param=Value"

    Context "When webdeploy package input only provided" {

        Mock Test-Path { return $true }

        $result = Get-MsDeployCmdArgs -webDeployPackage $webDeployPackage

        It "msDeployCmdArgs should only contain -source:packge"{
            ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) | Should Be $true
            ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) )| Should Be $false
            ( $result.Contains("-setParam:$overRideParams") ) | Should Be $false
        }
    }

    Context "When webdeploy and setParamFiles input only provided" {

        Mock Test-Path { return $true }

        $result = Get-MsDeployCmdArgs -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile

        It "msDeployCmdArgs should only contain -source:packge and -setParamFile" {
            ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) | Should Be $true
            ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) )| Should Be $true
            ( $result.Contains("-setParam:$overRideParams") ) | Should Be $false
        }
    }

    Context "When all three inputs are provided" {

        Mock Test-Path { return $true }

        $result = Get-MsDeployCmdArgs -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams
        
        It "msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam" {
            ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) | Should Be $true
            ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) )| Should Be $true
            ( $result.Contains("-setParam:$overRideParams") ) | Should Be $true
        }
    }

    Context "When webDeploy package does not exist" {

        $InvalidPkg = "n:\Invalid\pkg.zip"
        $errMsg = "Package does not exist : `"$InvalidPkg`""

        It "Should throw exception"{
            { Get-MsDeployCmdArgs -webDeployPackage $InvalidPkg -webDeployParamFile $webDeployParamFile -overRideParams $overRideParams } | Should Throw $errMsg
        }        
    }

    Context "When setParamFile does not exist" {

        Mock Test-Path { return $true } -ParameterFilter { $Path -eq $webDeployPackage }
        $InvalidParamFile = "n:\Invalid\param.xml"
        $errMsg = "Param file does not exist : `"$InvalidParamFile`""

        It "Should throw exception"{
            { Get-MsDeployCmdArgs -webDeployPackage $webDeployPackage -webDeployParamFile $InvalidParamFile -overRideParams $overRideParams } | Should Throw $errMsg
        }
    }

    Context "When two override params is given" {

        $param1 = "name1=value1"
        $param2 = "name2=value2"

        $params = $param1 + [System.Environment]::NewLine + $param2

        Mock Test-Path { return $true }

        $result = Get-MsDeployCmdArgs -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $params
        
        It "msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam for each override param" {
            ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) | Should Be $true
            ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) )| Should Be $true
            ( $result.Contains("-setParam:$param1") ) | Should Be $true
            ( $result.Contains("-setParam:$param2") ) | Should Be $true
        }
    }

    Context "When two override params with an empty line in between is given" {

        $param1 = "name1=value1"
        $param2 = " "
        $param3 = "name2=value2"

        $params = $param1 + [System.Environment]::NewLine + $param2 + [System.Environment]::NewLine + $param3

        Mock Test-Path { return $true }

        $result = Get-MsDeployCmdArgs -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $params

        It "msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam for each override param"{
            ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) | Should Be $true
            ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) )| Should Be $true
            ( $result.Contains("-setParam:$param1") ) | Should Be $true
            ( $result.Contains("-setParam:$param2") ) | Should Be $false
            ( $result.Contains("-setParam:$param3") ) | Should Be $true
        }
    }

    Context "When two override params with an new line in between is given"{

        $param1 = " name1=value1"
        $param2 = "name2=value2"

        $params = $param1 + [System.Environment]::NewLine + [System.Environment]::NewLine + [System.Environment]::NewLine + $param2

        Mock Test-Path { return $true }

        $result = Get-MsDeployCmdArgs -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -overRideParams $params
        
        It "msDeployCmdArgs should contain -source:packge, -setParamFile and -setParam for each override param"{
            ( $result.Contains([string]::Format('-source:package="{0}"', $webDeployPackage) ) ) | Should Be $true
            ( $result.Contains([string]::Format('-setParamFile="{0}"', $webDeployParamFile) ) )| Should Be $true
            ( $result.Contains([string]::Format("-setParam:{0}", $param1.Trim()))) | Should Be $true
            ( $result.Contains("-setParam:$param2") ) | Should Be $true
            ( $result.Contains([string]::Format('-setParam:{0}', [System.Environment]::NewLine) ) )| Should Be $false
        }
    }
}

Describe "Tests for verifying Deploy-WebSite functionality" {

    Context "It should append msDeploy path and msDeploy args and run"{

        $msDeploy = "Msdeploy.exe"
        $msDeployArgs = " -verb:sync -source:package=Web.zip -setParamFile=SampleParam.xml"
        
        Mock Run-Command -Verifiable { return }
        Mock Get-MsDeployLocation -Verifiable { return $msDeploy }
        Mock Get-MsDeployCmdArgs -Verifiable { return $msDeployArgs }

        $output = Deploy-WebSite -webDeployPkg "Web.zip" -webDeployParamFile "SampleParam.xml" 4>&1 | Out-String

        It "Should contain both msDeploy and msDeployArgs"{
            ($output.Contains("$msDeploy")) | Should Be $true
            ($output.Contains("$msDeployArgs")) | Should Be $true
            Assert-VerifiableMocks
        }
    }
}

Describe "Tests for verifying Execute-Main functionality" {

    Context "When execute main is invoked with all inputs"{
        $webDeployPackage = "WebDeploy.Pkg"
        $webDeployParamFile = "Param.xml"
        $overrideParams = "Abc=xyz"
        
        Mock Deploy-WebSite -Verifiable { return } -ParameterFilter { $WebDeployPkg -eq $WebDeployPackage -and $WebDeployParamFile -eq $webDeployParamFile -and $OverRideParams -eq $overRideParams}

        Execute-Main -WebDeployPackage $WebDeployPackage -webDeployParamFile $WebDeployParamFile -overRiderParams $OverRideParams

        It "Should deploy website"{
            Assert-VerifiableMocks
            Assert-MockCalled Deploy-WebSite -Times 1
        }
    }
}
