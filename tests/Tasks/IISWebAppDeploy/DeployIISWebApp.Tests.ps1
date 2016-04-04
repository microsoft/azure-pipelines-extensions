$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$deployIISWebAppPath = "$currentScriptPath\..\..\..\src\Tasks\IISWebAppDeploy\$sut"

if(-not (Test-Path -Path $deployIISWebAppPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find DeployIISWebApp.ps1 at $deployIISWebAppDirectoryPath"
}

#Adding Invoke-RemoteDeployment, Import-Module, Get-LocalizedString dummy implementation for testability purpose
function Import-Module
{    
    Write-Verbose "Dummy Import-Module" -Verbose
}

function Invoke-RemoteDeployment
{   
    Param(
        [string]$environmentName,
        [string]$adminUserName,
        [string]$adminPassword,
        [string]$protocol,
        [string]$testCertificate,
        [string]$tags,
        [string]$machineNames,
        [string]$scriptPath,
        [string]$scriptBlockContent,
        [string]$scriptArguments,
        [string]$initializationScriptPath,
        [string]$runPowershellInParallel,
        [string]$sessionVariables
    )

    Write-Verbose "Dummy Invoke-RemoteDeployment" -Verbose
}

function Get-LocalizedString
{
    param(
    [string]$key
    )

    Write-Verbose "Dummy Get-LocalizedString" -Verbose
}


. "$deployIISWebAppPath"

Describe "Tests for testing Get-HostName functionality" {
    
    $hostnamewithhttp = "hostnamewithhttp"
    $hostnamewithsni = "hostnamewithsni"
    $hostnamewithoutsni = "hostnamewithoutsni"

    Context "When protocol is http" {
        
        $hostname = Get-HostName -protocol "http" -hostNameWithHttp $hostnamewithhttp  -hostNameWithSNI $hostnamewithsni -hostNameWithOutSNI $hostnamewithoutsni -sni "false"

        It "should return hostnamewithhtpp"{
            ( $hostname ) | Should Be $hostnamewithhttp            
        }
    }

    Context "When protocol is https and sni is true" {

        $hostname = Get-HostName -protocol "https" -hostNameWithHttp $hostnamewithhttp  -hostNameWithSNI $hostnamewithsni -hostNameWithOutSNI $hostnamewithoutsni -sni "true"

        It "should return hostnamewithhtpp"{
            ( $hostname ) | Should Be $hostnamewithsni          
        }
    }

    Context "When protocol is https and sni is false" {

        $hostname = Get-HostName -protocol "https" -hostNameWithHttp $hostnamewithhttp  -hostNameWithSNI $hostnamewithsni -hostNameWithOutSNI $hostnamewithoutsni -sni "false"

        It "should return hostnamewithhtpp"{
            ( $hostname ) | Should Be $hostnamewithoutsni            
        }
    }
}

Describe "Tests for testing Trim-Inputs functionality" {

    $pkgNoExtraQuotes = "webdeploy.zip"
    $paramfileNoExtraQuotes = "paramfile.xml"
    $siteNoExtraQuotes = "website"
    $pathNoExtraQuotes = "c:\web app\path"
    $appPoolNameNoExtraQuotes = "application pool name"

    $siteAuthUserNoSpaces = "dummyuser"
    $adminUserNoSpaces = "adminuser"
    $appPoolUserNoSpaces = "apppooluser"
    
    Context "Should remove extra quotes for all inputs except usernames " {

        $pkg = "`"webdeploy.zip`""
        $paramfile = "`"paramfile.xml`""
        $site = "`"website`""
        $path = "`"c:\web app\path`""
        $appPoolName = "`"application pool name`""
                
        Trim-Inputs -package ([ref]$pkg) -paramFile ([ref]$paramfile) -siteName ([ref]$site) -physicalPath ([ref]$path)  -poolName ([ref]$appPoolName) -websitePathAuthuser ([ref]$siteAuthUserNoSpaces) -appPoolUser ([ref]$appPoolUserNoSpaces) -adminUser ([ref]$adminUserNoSpaces)

        It "should not have extra double quotes"{
            ( $pkg ) | Should Be $pkgNoExtraQuotes            
            ( $paramfile ) | Should Be $paramfileNoExtraQuotes
            ( $site ) | Should Be $siteNoExtraQuotes
            ( $path ) | Should Be $pathNoExtraQuotes
            ( $appPoolName ) | Should Be $appPoolNameNoExtraQuotes
        }        
    }

    Context "Should remove extra spaces for appPooluserName, websiteAuthUser, adminUserName" {
        
        $siteAuthUser = " dummyuser"
        $adminUser = " adminuser "
        $appPoolUser = " apppooluser "
                
        Trim-Inputs -package ([ref]$pkgNoExtraQuotes) -paramFile ([ref]$paramfileNoExtraQuotes) -siteName ([ref]$siteNoExtraQuotes) -physicalPath ([ref]$pathNoExtraQuotes)  -poolName ([ref]$appPoolNameNoExtraQuotes) -websitePathAuthuser ([ref]$siteAuthUser) -appPoolUser ([ref]$appPoolUser) -adminUser ([ref]$adminUser)

        It "should not have extra double quotes"{
            ( $siteAuthUser ) | Should Be $siteAuthUserNoSpaces            
            ( $adminUser ) | Should Be $adminUserNoSpaces
            ( $appPoolUser ) | Should Be $appPoolUserNoSpaces
        }
    }
}

Describe "Tests for testing Validate-Inputs functionality" {
    Context "Should throw when createWebsite true and sitename empty" {
        
        $errorMsg = "Website Name cannot be empty if you want to create or update the target website."
                
        It "Should throw exception" {
            { Validate-Inputs -createWebsite "true" -websiteName " " -createAppPool "true" -appPoolName "dummyapppool" } | Should Throw $errorMsg
        }
    }

    Context "Should not throw when createWebsite true and sitename is not empty" {

        try
        {
            $result = Validate-Inputs -createWebsite "true" -websiteName "dummywebsite" -createAppPool "true" -appPoolName "dummyapppool"
        }
        catch
        {
            $result = $_
        }

        It "Should not throw exception" {
           $result.Exception | Should Be $null
        }
    }

    Context "Should throw when createAppPool true and app pool name empty" {

        $errorMsg = "Application pool name cannot be empty if you want to create or update the target app pool."
                
        It "Should throw exception" {
            { Validate-Inputs -createWebsite "false" -websiteName "dummysite" -createAppPool "true" -appPoolName " " } | Should Throw $errorMsg
        }

    }

    Context "Should not throw when createAppPool true and app pool name not empty" {

        It "Should not throw exception" {
            { Validate-Inputs -createWebsite "false" -websiteName "dummywebsite" -createAppPool "true" -appPoolName "dummyapppool" } | Should Not Throw
        }

    }

    Context "Should not throw when createWebsite false and createAppPool false" {

        It "Should not throw exception" {
            { Validate-Inputs -createWebsite "false" -websiteName " " -createAppPool "false" -appPoolName " " } | Should Not Throw
        }
    }
}

Describe "Tests for testing Compute-MsDeploy-SetParams functionality" {
    Context "when createWebsite is false" {

        $result = Compute-MsDeploy-SetParams -createWebsite "false" -websiteName "dummyWebsite" -overRideParams "DummyOverrideParams"

        It "Shouldn't alter override params " {
            ( $result ) | Should Be "DummyOverrideParams"
        }
    }

    Context "when createWebsite is true and override params for websitename is already present" {

        $result = Compute-MsDeploy-SetParams -createWebsite "true" -websiteName "dummyWebsite" -overRideParams 'name="IIS Web Application Name",value="dummyWebsite"'

        It "Shouldn't alter override params " {
            ( $result ) | Should Be 'name="IIS Web Application Name",value="dummyWebsite"'
        }
    }

    Context "When no override params is given and createwebsite is true" {

        $result = Compute-MsDeploy-SetParams -createWebsite "true" -websiteName "dummyWebsite"  -overRideParams "DummyOverrideParams"

        It "Should add setParam to deploy on website" {
            ($result.Contains('name="IIS Web Application Name",value="dummyWebsite"')) | Should Be $true
        }
    }

    Context "When createwebsite is true and override params contain db connection string override" {
        
        $result = Compute-MsDeploy-SetParams -createWebsite "true" -websiteName "dummyWebsite" -overRideParams 'name="ConnectionString",value="DummyConnectionString"'

        It "Should add setParam to deploy on website" {
            ($result.Contains('name="IIS Web Application Name",value="dummyWebsite"')) | Should Be $true
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

        $script = Get-ScriptToRun -webDeployPackage "pkg.zip" -webDeployParamFile "" -overRideParams "" -websiteName "dummysite" -websitePhysicalPath "C:\inetpub\wwwroot" -websitePhysicalPathAuth "Pass through" -websiteAuthUserName "" -websiteAuthUserPassword "" -addBinding "true" -assignDuplicateBinding "true" -protocol "http" -ipAddress "127.0.0.1" -port "8743" -hostName "" -serverNameIndication "false" -sslCertThumbPrint "" -appPoolName "" -pipeLineMode "Integrated" -dotNetVersion "v4.0" -appPoolIdentity "Identity" -appPoolUsername "" -appPoolPassword "" -appCmdCommands "" -createWebsite "true" -createAppPool "false"

        It "should contain script content and invoke expression" {
            ($script.Contains('Dummy Script')) | Should Be $true
            ($script.Contains('Execute-Main -WebDeployPackage "pkg.zip" -WebDeployParamFile "" -OverRideParams "" -WebsiteName "dummysite" -WebsitePhysicalPath "C:\inetpub\wwwroot" -WebsitePhysicalPathAuth "Pass through" -WebsiteAuthUserName "" -WebsiteAuthUserPassword "" -AddBinding true -AssignDuplicateBinding true -Protocol http -IpAddress "127.0.0.1" -Port 8743 -HostName "" -ServerNameIndication false -SslCertThumbPrint "" -AppPoolName "" -DotNetVersion "v4.0" -PipeLineMode Integrated -AppPoolIdentity Identity -AppPoolUsername "" -AppPoolPassword "" -AppCmdCommands "" -CreateWebsite true -CreateAppPool false')) | Should Be $true
        }
    }
}

Describe "Tests for testing Run-RemoteDeployment" {
    
    $environmentName = "dummyenv"
    $script = "dummyscript"
    $deployInParallel = "true"
    $adminUserName = "dummyuser"
    $adminPassword = "dummypassword"
    $http = "http"
    $https = "https"
    $filter = "dummyFilter"


    Context "Tags filter is input" {
        
        Mock Invoke-RemoteDeployment -Verifiable { return "" } -ParameterFilter { $EnvironmentName -eq $environmentName -and $Tags -eq $filter -and  $ScriptBlockContent -eq $script -and $RunPowershellInParallel -eq $deployInParallel -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false"}
        
        try
        {
            $result = Run-RemoteDeployment -scriptToRun $script -filteringMethod "tags" -filter $filter -envName $environmentName -deployInParallel $deployInParallel -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false"
        }
        catch
        {
            $result = $_
        }
                        
        It "Should run invoke-remoteDeployment with tags filter" {
            $result.Exception | Should Be $null
            Assert-VerifiableMocks
        }
    }

    Context "Machines filter is input" {

        Mock Invoke-RemoteDeployment -Verifiable { return "" } -ParameterFilter { $EnvironmentName -eq $environmentName -and $MachineNames -eq $filter -and  $ScriptBlockContent -eq $script -and $RunPowershellInParallel -eq $deployInParallel -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false"}
        
        try
        {
            $result = Run-RemoteDeployment -scriptToRun $script -filteringMethod "machines" -filter $filter -envName $environmentName -deployInParallel $deployInParallel -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false"
        }
        catch
        {
            $result = $_
        }
                        
        It "Should run invoke-remoteDeployment with machineNames filter" {
            $result.Exception | Should Be $null
            Assert-VerifiableMocks
        }
    }    

    Context "Should throw on failure of remote execution" {
        
        Mock Invoke-RemoteDeployment -Verifiable { return "Error occurred" } -ParameterFilter { $EnvironmentName -eq $environmentName -and $Tags -eq $filter -and  $ScriptBlockContent -eq $script -and $RunPowershellInParallel -eq $deployInParallel -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false"}
        
        try
        {
            $result = Run-RemoteDeployment -scriptToRun $script -filteringMethod "tags" -filter $filter -envName $environmentName -deployInParallel $deployInParallel -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false"
        }
        catch
        {
            $result = $_
        }
                        
        It "Should run invoke-remoteDeployment with tags filter" {
            ($result.Exception.ToString().Contains('Error occurred')) | Should Be $true
            Assert-VerifiableMocks
        }

    }
}

Describe "Tests for testing Main functionality" {
    Context "Should integrate all the functions and call with appropriate arguments" {
        
        Mock Get-Content -Verifiable {return "dummyscript"}
        Mock Invoke-RemoteDeployment -Verifiable { return "" } -ParameterFilter { $Tags -eq $filter }        

        Main -environmentName "dummyenv" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -resourceFilteringMethod "tags" -machineFilter "tag1:value1" -webDeployPackage "pkg.zip" -webDeployParamFile "param.xml" -overRideParams "dummyoverride" -createWebsite "true" -websiteName "dummyweb" -websitePhysicalPath "c:\inetpub\wwwroot" -websitePhysicalPathAuth "Pass through" -websiteAuthUserName "" -websiteAuthUserPassword "" -addBinding "true" -assignDuplicateBinding "true" -protocol "http" -ipAddress "127.0.o.1" -port "8080" -hostNameWithHttp "" -hostNameWithOutSNI "" -hostNameWithSNI "" -serverNameIndication "false" -sslCertThumbPrint "" -createAppPool "true" -appPoolName "dummy app pool" -dotNetVersion "v4.0" -pipeLineMode "Integrated" -appPoolIdentity "Specific User" -appPoolUsername "dummy user" -appPoolPassword "dummy password" -appCmdCommands "" -deployInParallel "true"

        It "Should integrate all the functions and call with appropriate arguments" {
            Assert-VerifiableMocks
        }

    }
}

