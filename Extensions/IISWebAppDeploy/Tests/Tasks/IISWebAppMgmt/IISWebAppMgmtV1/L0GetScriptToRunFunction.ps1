[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\ManageIISWebApp.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: should contain script content and invoke expression, Should contain msdeploy on remote machines script and invoke expression at the end
Register-Mock Get-Content {return "Dummy Script"}
$script = Get-ScriptToRun -createWebsite "true" -websiteName "dummysite" -websitePhysicalPath "C:\inetpub\wwwroot" -websitePhysicalPathAuth "Pass through" -websiteAuthUserName "dummyuser" -websiteAuthUserPassword "d`"ummypassword" -addBinding "true" -protocol "http" -ipAddress "127.0.0.1" -port "8743" -hostName "" -serverNameIndication "false" -sslCertThumbPrint "" -createAppPool "false" -appPoolName "" -pipeLineMode "Integrated" -dotNetVersion "v4.0" -appPoolIdentity "Identity" -appPoolUsername "dummyuser" -appPoolPassword "d`"ummypassword" -appCmdCommands "abc`""
Assert-AreEqual $true ($script.Contains('Dummy Script'))
Assert-AreEqual $true ($script.Contains('Execute-Main -CreateWebsite true -WebsiteName "dummysite" -WebsitePhysicalPath "C:\inetpub\wwwroot" -WebsitePhysicalPathAuth "Pass through" -WebsiteAuthUserName "dummyuser" -WebsiteAuthUserPassword "d`"ummypassword" -AddBinding true -Protocol http -IpAddress "127.0.0.1" -Port 8743 -HostName "" -ServerNameIndication false -SslCertThumbPrint "" -CreateAppPool false -AppPoolName "" -DotNetVersion "v4.0" -PipeLineMode Integrated -AppPoolIdentity Identity -AppPoolUsername "dummyuser" -AppPoolPassword "d`"ummypassword" -AppCmdCommands "abc`""'))
