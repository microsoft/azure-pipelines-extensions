Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\InvokeRemoteDeployment.ps1

Write-Verbose "Entering script ManageIISWebApp.ps1"

function Get-HostName
{
    param(
        [string]$protocol,
        [string]$hostNameWithHttp,
        [string]$hostNameWithSNI,
        [string]$hostNameWithOutSNI,
        [string]$sni
    )
    $hostName = [string]::Empty

    if($protocol -eq "http")
    {
        $hostName = $hostNameWithHttp
    }
    elseif($sni -eq "true")
    {
        $hostName = $hostNameWithSNI
    }
    else
    {
        $hostName = $hostNameWithOutSNI
    }
    return $hostName
}

function Trim-Inputs([ref]$siteName, [ref]$physicalPath, [ref]$poolName, [ref]$websitePathAuthuser, [ref]$appPoolUser, [ref]$adminUser)
{
    Write-Verbose "Triming inputs for excess spaces, double quotes"

    $siteName.Value = $siteName.Value.Trim('"', ' ')
    $physicalPath.Value = $physicalPath.Value.Trim('"', ' ').Trim('\', ' ')
    $poolName.Value = $poolName.Value.Trim('"', ' ')

    $appPoolUser.Value = $appPoolUser.Value.Trim()
    $websitePathAuthuser.Value = $websitePathAuthuser.Value.Trim()
    $adminUser.Value = $adminUser.Value.Trim()
}

function Validate-Inputs
{
    param(
        [string]$createWebsite,
        [string]$websiteName,
        [string]$createAppPool,
        [string]$appPoolName
    )

    Write-Verbose "Validating website and application pool inputs"
    if($createWebsite -ieq "true" -and [string]::IsNullOrWhiteSpace($websiteName))
    { 
        throw "Website Name cannot be empty if you want to create or update the target website."
    }

    if($createAppPool -ieq "true" -and [string]::IsNullOrWhiteSpace($appPoolName))
    { 
        throw "Application pool name cannot be empty if you want to create or update the target app pool."
    }
}

function Escape-SpecialChars
{
    param(
        [string]$str
    )

    return $str.Replace('`', '``').Replace('"', '`"').Replace('$', '`$')
}

function Get-ScriptToRun
{
    param (
        [string]$createWebsite,
        [string]$websiteName,
        [string]$websitePhysicalPath,
        [string]$websitePhysicalPathAuth,
        [string]$websiteAuthUserName,
        [string]$websiteAuthUserPassword,
        [string]$addBinding,
        [string]$protocol,
        [string]$ipAddress,
        [string]$port,
        [string]$hostName,
        [string]$serverNameIndication,
        [string]$sslCertThumbPrint,
        [string]$createAppPool,
        [string]$appPoolName,
        [string]$pipeLineMode,
        [string]$dotNetVersion,
        [string]$appPoolIdentity,
        [string]$appPoolUsername,
        [string]$appPoolPassword,
        [string]$appCmdCommands
    )

    $msDeployScript = Get-Content  ./AppCmdOnTargetMachines.ps1 | Out-String

    $appPoolPassword = Escape-SpecialChars -str $appPoolPassword
    $websiteAuthUserPassword = Escape-SpecialChars -str $websiteAuthUserPassword
    $appCmdCommands = Escape-SpecialChars -str $appCmdCommands

    $invokeMain = "Execute-Main -CreateWebsite $createWebsite -WebsiteName `"$websiteName`" -WebsitePhysicalPath `"$websitePhysicalPath`" -WebsitePhysicalPathAuth `"$websitePhysicalPathAuth`" -WebsiteAuthUserName `"$websiteAuthUserName`" -WebsiteAuthUserPassword `"$websiteAuthUserPassword`" -AddBinding $addBinding -Protocol $protocol -IpAddress `"$ipAddress`" -Port $port -HostName `"$hostName`" -ServerNameIndication $serverNameIndication -SslCertThumbPrint `"$sslCertThumbPrint`" -CreateAppPool $createAppPool -AppPoolName `"$appPoolName`" -DotNetVersion `"$dotNetVersion`" -PipeLineMode $pipeLineMode -AppPoolIdentity $appPoolIdentity -AppPoolUsername `"$appPoolUsername`" -AppPoolPassword `"$appPoolPassword`" -AppCmdCommands `"$appCmdCommands`""

    Write-Verbose "Executing main funnction in AppCmdOnTargetMachines : $invokeMain"
    $msDeployOnTargetMachinesScript = [string]::Format("{0} {1} ( {2} )", $msDeployScript,  [Environment]::NewLine,  $invokeMain)
    return $msDeployOnTargetMachinesScript
}

function Run-RemoteDeployment
{
    param(
        [string]$machinesList,
        [string]$scriptToRun,
        [string]$adminUserName,
        [string]$adminPassword,
        [string]$winrmProtocol,
        [string]$testCertificate,
        [string]$deployInParallel,
        [string]$websiteName
    )

    Write-Host "Started creating website: $websiteName"

    $errorMessage = Invoke-RemoteDeployment -machinesList $machinesList -scriptToRun $scriptToRun -adminUserName $adminUserName -adminPassword $adminPassword -protocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel

    if(-not [string]::IsNullOrEmpty($errorMessage))
    {
        $helpMessage = "For more info please refer to http://aka.ms/iisextnreadme"
        Write-Error "$errorMessage`n$helpMessage"
        return
    }

    Write-Host "Successfully created website: $websiteName" 
}

function Main
{
    param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [string]$createWebsite,
    [string]$websiteName,
    [string]$websitePhysicalPath,
    [string]$websitePhysicalPathAuth,
    [string]$websiteAuthUserName,
    [string]$websiteAuthUserPassword,
    [string]$addBinding,
    [string]$protocol,
    [string]$ipAddress,
    [string]$port,
    [string]$hostNameWithHttp,
    [string]$hostNameWithOutSNI,
    [string]$hostNameWithSNI,
    [string]$serverNameIndication,
    [string]$sslCertThumbPrint,
    [string]$createAppPool,
    [string]$appPoolName,
    [string]$dotNetVersion,
    [string]$pipeLineMode,
    [string]$appPoolIdentity,
    [string]$appPoolUsername,
    [string]$appPoolPassword,
    [string]$appCmdCommands,
    [string]$deployInParallel
    )

    $hostName = Get-HostName -protocol $protocol -hostNameWithHttp $hostNameWithHttp -hostNameWithSNI $hostNameWithSNI -hostNameWithOutSNI $hostNameWithOutSNI -sni $serverNameIndication

    Write-Verbose "machinesList = $machinesList"
    Write-Verbose "adminUserName = $adminUserName"
    Write-Verbose "winrmProtocol  = $winrmProtocol"
    Write-Verbose "testCertificate = $testCertificate"

    Write-Verbose "createWebsite = $createWebsite"
    Write-Verbose "websiteName = $websiteName"
    Write-Verbose "websitePhysicalPath = $websitePhysicalPath"
    Write-Verbose "websitePhysicalPathAuth = $websitePhysicalPathAuth"
    Write-Verbose "websiteAuthUserName = $websiteAuthUserName"
    Write-Verbose "addBinding = $addBinding"
    Write-Verbose "protocol = $protocol"
    Write-Verbose "ipAddress = $ipAddress"
    Write-Verbose "port = $port"
    Write-Verbose "hostName = $hostName"
    Write-Verbose "serverNameIndication = $serverNameIndication"

    Write-Verbose "createAppPool = $createAppPool"
    Write-Verbose "appPoolName = $appPoolName"
    Write-Verbose "dotNetVersion = $dotNetVersion"
    Write-Verbose "pipeLineMode = $pipeLineMode"
    Write-Verbose "appPoolIdentity = $appPoolIdentity"
    Write-Verbose "appPoolUsername = $appPoolUsername"

    Write-Verbose "appCmdCommands = $appCmdCommands"
    Write-Verbose "deployInParallel = $deployInParallel"

    Trim-Inputs -siteName ([ref]$websiteName) -physicalPath ([ref]$websitePhysicalPath)  -poolName ([ref]$appPoolName) -websitePathAuthuser ([ref]$websiteAuthUserName) -appPoolUser ([ref]$appPoolUsername) -adminUser ([ref]$adminUserName)

    Validate-Inputs -createWebsite $createWebsite -websiteName $websiteName -createAppPool $createAppPool -appPoolName $appPoolName

    $script = Get-ScriptToRun -createWebsite $createWebsite -websiteName $websiteName -websitePhysicalPath $websitePhysicalPath -websitePhysicalPathAuth $websitePhysicalPathAuth -websiteAuthUserName $websiteAuthUserName -websiteAuthUserPassword $websiteAuthUserPassword -addBinding $addBinding -protocol $protocol -ipAddress $ipAddress -port $port -hostName $hostName -serverNameIndication $serverNameIndication -sslCertThumbPrint $sslCertThumbPrint -createAppPool $createAppPool -appPoolName $appPoolName -pipeLineMode $pipeLineMode -dotNetVersion $dotNetVersion -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands
    Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel -websiteName $websiteName
}