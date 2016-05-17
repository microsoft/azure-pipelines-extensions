$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$scritpDirName = Split-Path -Leaf $currentScriptPath
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$manageIISWebAppPath = "$currentScriptPath\..\..\..\Src\Tasks\$scritpDirName\$sut"

if(-not (Test-Path -Path $manageIISWebAppPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find ManageIISWebApp.ps1 at $manageIISWebAppPath"
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

. "$manageIISWebAppPath"
. "$invokeRemoteDeploymentPath"

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

    $siteNoExtraQuotes = "website"
    $pathNoExtraQuotes = "c:\web app\path"
    $appPoolNameNoExtraQuotes = "application pool name"

    $siteAuthUserNoSpaces = "dummyuser"
    $adminUserNoSpaces = "adminuser"
    $appPoolUserNoSpaces = "apppooluser"
    
    Context "Should remove extra quotes for all inputs except usernames " {

        $site = "`"website`""
        $path = "`"c:\web app\path`""
        $appPoolName = "`"application pool name`""
                
        Trim-Inputs -siteName ([ref]$site) -physicalPath ([ref]$path)  -poolName ([ref]$appPoolName) -websitePathAuthuser ([ref]$siteAuthUserNoSpaces) -appPoolUser ([ref]$appPoolUserNoSpaces) -adminUser ([ref]$adminUserNoSpaces)

        It "should not have extra double quotes"{
            ( $site ) | Should Be $siteNoExtraQuotes
            ( $path ) | Should Be $pathNoExtraQuotes
            ( $appPoolName ) | Should Be $appPoolNameNoExtraQuotes
        }        
    }

    Context "Should remove extra spaces for appPooluserName, websiteAuthUser, adminUserName" {
        $siteAuthUser = " dummyuser"
        $adminUser = " adminuser "
        $appPoolUser = " apppooluser "

        Trim-Inputs -siteName ([ref]$siteNoExtraQuotes) -physicalPath ([ref]$pathNoExtraQuotes)  -poolName ([ref]$appPoolNameNoExtraQuotes) -websitePathAuthuser ([ref]$siteAuthUser) -appPoolUser ([ref]$appPoolUser) -adminUser ([ref]$adminUser)

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

Describe "Tests for testing Escape-SpecialChars functionality" {

    Context "When input string contains double quote character" {

        It "Should add powershell escape character for double quotes" {
            (Escape-SpecialChars -str 'StringWithDouble"Quotes') | Should Be 'StringWithDouble`"Quotes'
        }
    }

    Context "When input string contains dollar symbol character" {

        It "Should add powershell escape character for dollar symbol" {
            (Escape-SpecialChars -str 'StringWith$dollar') | Should Be 'StringWith`$dollar'
        }
    }

    Context "When input string contains ` and $ symbol character" {

        It "Should add powershell escape ` and $ symbol character" {
            (Escape-SpecialChars -str 'StringWith`$dollar') | Should Be 'StringWith```$dollar'
        }
    }
}

Describe "Tests for testing Get-ScriptToRun functionality" {
    Context "Should contain msdeploy on remote machines script and invoke expression at the end" {

        Mock Get-Content {return "Dummy Script"}

        $script = Get-ScriptToRun -createWebsite "true" -websiteName "dummysite" -websitePhysicalPath "C:\inetpub\wwwroot" -websitePhysicalPathAuth "Pass through" -websiteAuthUserName "dummyuser" -websiteAuthUserPassword "d`"ummypassword" -addBinding "true" -protocol "http" -ipAddress "127.0.0.1" -port "8743" -hostName "" -serverNameIndication "false" -sslCertThumbPrint "" -createAppPool "false" -appPoolName "" -pipeLineMode "Integrated" -dotNetVersion "v4.0" -appPoolIdentity "Identity" -appPoolUsername "dummyuser" -appPoolPassword "d`"ummypassword" -appCmdCommands "abc`""

        Write-Verbose $script
        It "should contain script content and invoke expression" {
            ($script.Contains('Dummy Script')) | Should Be $true
            ($script.Contains('Execute-Main -CreateWebsite true -WebsiteName "dummysite" -WebsitePhysicalPath "C:\inetpub\wwwroot" -WebsitePhysicalPathAuth "Pass through" -WebsiteAuthUserName "dummyuser" -WebsiteAuthUserPassword "d`"ummypassword" -AddBinding true -Protocol http -IpAddress "127.0.0.1" -Port 8743 -HostName "" -ServerNameIndication false -SslCertThumbPrint "" -CreateAppPool false -AppPoolName "" -DotNetVersion "v4.0" -PipeLineMode Integrated -AppPoolIdentity Identity -AppPoolUsername "dummyuser" -AppPoolPassword "d`"ummypassword" -AppCmdCommands "abc`""')) | Should Be $true
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

        Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -createWebsite "true" -websiteName "dummyweb" -websitePhysicalPath "c:\inetpub\wwwroot" -websitePhysicalPathAuth "Pass through" -websiteAuthUserName "" -websiteAuthUserPassword "" -addBinding "true" -protocol "http" -ipAddress "127.0.o.1" -port "8080" -hostNameWithHttp "" -hostNameWithOutSNI "" -hostNameWithSNI "" -serverNameIndication "false" -sslCertThumbPrint "" -createAppPool "true" -appPoolName "dummy app pool" -dotNetVersion "v4.0" -pipeLineMode "Integrated" -appPoolIdentity "Specific User" -appPoolUsername "dummy user" -appPoolPassword "dummy password" -appCmdCommands "" -deployInParallel "true"

        It "Should integrate all the functions and call with appropriate arguments" {
            Assert-VerifiableMocks
        }
    }
}

