Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\InvokeRemoteDeployment.ps1

Write-Verbose "Entering script ManageIISWebApp.ps1"


function Set-IISWebSite
{
    param (
        [string] $actionIISWebsite,
        [string] $websiteName,
        [string] $startStopWebsiteName,
        [string] $physicalPath,
        [string] $physicalPathAuth,
        [string] $physicalPathAuthUserName,
        [string] $physicalPathAuthUserPassword ,

        [string] $addBinding,
        [string] $protocol,
        [string] $ipAddress,
        [string] $port,
        [string] $serverNameIndication ,
        [string] $hostNameWithOutSNI,
        [string] $hostNameWithHttp,
        [string] $hostNameWithSNI,
        [string] $sslCertThumbPrint,
        [string] $bindings,

        [string] $createOrUpdateAppPool,
        [string] $appPoolName,
        [string] $dotNetVersion,
        [string] $pipeLineMode,
        [string] $appPoolIdentity,
        [string] $appPoolUsername,
        [string] $appPoolPassword,

        [string] $configureAuthentication,
        [string] $anonymousAuthentication,
        [string] $basicAuthentication,
        [string] $windowsAuthentication,

        [string] $appCmdCommands
    )

    switch ($actionIISWebsite) 
    {
        "CreateOrUpdateWebsite" 
        {
            Repair-Inputs -siteName ([ref]$websiteName) -physicalPath ([ref]$physicalPath)  -poolName ([ref]$appPoolName) -physicalPathAuthuser ([ref]$physicalPathAuthUserName) -appPoolUser ([ref]$appPoolUsername)
            
            if($addBinding -eq "true") 
            {
                if([string]::IsNullOrWhiteSpace($bindings)) {
                    $bindingsArray = @(@{
                        protocol = $protocol.Trim();
                        ipAddress = $ipAddress.Trim();
                        port = $port.Trim();
                        sniFlag = $serverNameIndication;
                        sslThumbprint = Test-SSLCertificateThumbprint -sslCertThumbPrint $sslCertThumbPrint -ipAddress $ipAddress -protocol $protocol -port $port ;
                        hostname = Get-Hostname -port $port -hostNameWithSNI $hostNameWithSNI -hostNameWithHttp $hostNameWithHttp -hostNameWithOutSNI $hostNameWithOutSNI -sni $serverNameIndication ;
                    })
                }
                else {
                    $bindingsArray = Validate-Bindings -bindings $bindings
                }
            }

            $bindingsJson = $bindingsArray | ConvertTo-Json
            $bindingsJson = Escape-SpecialChars $bindingsJson

            if ($createOrUpdateAppPool -eq "true") 
            {
                Write-Verbose "Initiating action 'create or update' website with user specified application pool."
                return "Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName `"$websiteName`" -PhysicalPath `"$physicalPath`" -PhysicalPathAuth `"$physicalPathAuth`" -PhysicalPathAuthUsername `"$physicalPathAuthUserName`" -PhysicalPathAuthUserPassword `"$physicalPathAuthUserPassword`" -AddBinding $addBinding -Bindings `"$bindingsJson`" -ActionIISApplicationPool `"CreateOrUpdateAppPool`" -AppPoolName `"$appPoolName`" -DotNetVersion `"$dotNetVersion`" -PipeLineMode `"$pipeLineMode`" -AppPoolIdentity $appPoolIdentity -AppPoolUsername `"$appPoolUsername`" -AppPoolPassword `"$appPoolPassword`" -configureAuthentication $configureAuthentication -anonymousAuthentication $anonymousAuthentication -basicAuthentication $basicAuthentication -windowsAuthentication $windowsAuthentication -AppCmdCommands `"$appCmdCommands`""
            }
            else 
            {
                Write-Verbose "Initiating action 'create or update' website"
                return "Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName `"$websiteName`" -PhysicalPath `"$physicalPath`" -PhysicalPathAuth `"$physicalPathAuth`" -PhysicalPathAuthUsername `"$physicalPathAuthUserName`" -PhysicalPathAuthUserPassword `"$physicalPathAuthUserPassword`" -AddBinding $addBinding -Bindings `"$bindingsJson`" -configureAuthentication $configureAuthentication -anonymousAuthentication $anonymousAuthentication -basicAuthentication $basicAuthentication -windowsAuthentication $windowsAuthentication -AppCmdCommands `"$appCmdCommands`""
            }
        }
        {($_ -eq "StartWebsite") -or ($_ -eq "StopWebsite")}
        {
            Repair-Inputs -siteName ([ref]$startStopWebsiteName)
            
            return "Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName `"$startStopWebsiteName`" -AppCmdCommands `"$appCmdCommands`""
        }
        default 
        {
            throw ("Invalid action `"$actionIISWebsite`" selected for the IIS Website.")
        }
    }    
}

function Set-IISVirtualDirectory
{
    param (
        [string] $parentWebsiteName,
        [string] $virtualPath,
        [string] $physicalPath,
        [string] $PhysicalPathAuth,
        [string] $physicalPathAuthUserName,
        [string] $physicalPathAuthUserPassword,
        [string] $appCmdCommands
    )

    Repair-Inputs -siteName ([ref]$parentWebsiteName) -virtualPath ([ref]$virtualPath) -physicalPath ([ref]$physicalPath) -physicalPathAuthuser ([ref]$physicalPathAuthUserName)
    Test-Inputs -virtualPath $virtualPath

    Write-Verbose "Initiating action 'create or update' virtual directory."
    return "Invoke-Main -CreateVirtualDirectory `$true -WebsiteName `"$parentWebsiteName`" -VirtualPath `"$virtualPath`" -PhysicalPath `"$physicalPath`" -PhysicalPathAuth `"$PhysicalPathAuth`" -PhysicalPathAuthUsername `"$physicalPathAuthUserName`" -PhysicalPathAuthUserPassword `"$physicalPathAuthUserPassword`" -AppCmdCommands `"$appCmdCommands`""
}

function Set-IISWebApplication 
{
    param (
        [string] $parentWebsiteName,
        [string] $virtualPath,
        [string] $physicalPath,
        [string] $physicalPathAuth,
        [string] $physicalPathAuthUserName,
        [string] $physicalPathAuthUserPassword,

        [string] $createOrUpdateAppPool,
        [string] $appPoolName,
        [string] $dotNetVersion,
        [string] $pipeLineMode,
        [string] $appPoolIdentity,
        [string] $appPoolUsername,
        [string] $appPoolPassword,
        [string] $appCmdCommands
    )

    Repair-Inputs -siteName ([ref]$parentWebsiteName) -virtualPath ([ref]$virtualPath) -physicalPath ([ref]$physicalPath) -physicalPathAuthuser ([ref]$physicalPathAuthUserName) -poolName ([ref]$appPoolName) -appPoolUser ([ref]$appPoolUsername) 
    Test-Inputs -virtualPath $virtualPath

    if ($createOrUpdateAppPool -eq "true") 
    {        
        Write-Verbose "Initiating action 'create or update' application with user specified application pool."
        return "Invoke-Main -CreateApplication `$true -WebsiteName `"$parentWebsiteName`" -VirtualPath `"$virtualPath`" -PhysicalPath `"$physicalPath`" -PhysicalPathAuth `"$applicationPhysicalPathAuth`" -PhysicalPathAuthUsername `"$physicalPathAuthUserName`" -PhysicalPathAuthUserPassword `"$physicalPathAuthUserPassword`" -ActionIISApplicationPool `"CreateOrUpdateAppPool`" -AppPoolName `"$appPoolName`" -DotNetVersion `"$dotNetVersion`" -PipeLineMode `"$pipeLineMode`" -AppPoolIdentity $appPoolIdentity -AppPoolUsername `"$appPoolUsername`" -AppPoolPassword `"$appPoolPassword`" -AppCmdCommands `"$appCmdCommands`""
    }
    else 
    {
        Write-Verbose "Initiating action 'create or update' application."
        return "Invoke-Main -CreateApplication `$true -WebsiteName `"$parentWebsiteName`" -VirtualPath `"$virtualPath`" -PhysicalPath `"$physicalPath`" -PhysicalPathAuth `"$applicationPhysicalPathAuth`" -PhysicalPathAuthUsername `"$physicalPathAuthUserName`" -PhysicalPathAuthUserPassword `"$physicalPathAuthUserPassword`" -AppCmdCommands `"$appCmdCommands`""
    }
}

function Set-IISApplicationPool
{
    param (
        [string] $actionIISApplicationPool,
        [string] $appPoolName,
        [string] $startStopRecycleAppPoolName,
        [string] $dotNetVersion,
        [string] $pipeLineMode,
        [string] $appPoolIdentity,
        [string] $appPoolUsername,
        [string] $appPoolPassword,
        [string] $appCmdCommands
    ) 

    switch ($actionIISApplicationPool) 
    {
        "CreateOrUpdateAppPool" 
        {
            Repair-Inputs -poolName ([ref]$appPoolName) -appPoolUser ([ref]$appPoolUsername) 

            Write-Verbose "Initiating action 'create or update' application pool."
            return "Invoke-Main -ActionIISApplicationPool $actionIISApplicationPool -AppPoolName `"$appPoolName`" -DotNetVersion `"$dotNetVersion`" -PipeLineMode `"$pipeLineMode`" -AppPoolIdentity $appPoolIdentity -AppPoolUsername `"$appPoolUsername`" -AppPoolPassword `"$appPoolPassword`" -AppCmdCommands `"$appCmdCommands`""
        }
        {($_ -eq "StartAppPool") -or ($_ -eq "StopAppPool") -or ($_ -eq "RecycleAppPool")}
        {
            Repair-Inputs -poolName ([ref]$startStopRecycleAppPoolName)

            return "Invoke-Main -ActionIISApplicationPool $actionIISApplicationPool -AppPoolName `"$startStopRecycleAppPoolName`" -AppCmdCommands `"$appCmdCommands`""
        }
        default 
        {
            throw ("Invalid action `"$actionIISApplicationPool`" selected for the IIS Application Pool.")
        }
    }
}

function Repair-Inputs([ref]$siteName, [ref]$physicalPath, [ref]$poolName, [ref]$virtualPath, [ref]$physicalPathAuthuser, [ref]$appPoolUser)
{
    Write-Verbose "Triming inputs for excess spaces, double quotes"

    if ($siteName -ne $null) 
    {
        $siteName.Value = $siteName.Value.Trim('"', ' ')
    }
    if ($physicalPath -ne $null) 
    {
        $physicalPath.Value = $physicalPath.Value.Trim('"', ' ').TrimEnd('\')
    }
    if ($virtualPath -ne $null) 
    {
        $virtualPath.Value = $virtualPath.Value.Trim('"', ' ').Trim('\')
    }
    if ($poolName -ne $null) 
    {
        $poolName.Value = $poolName.Value.Trim('"', ' ')
    }
    if ($appPoolUser -ne $null) 
    {
        $appPoolUser.Value = $appPoolUser.Value.Trim()
    }
    if ($physicalPathAuthuser -ne $null) 
    {
        $physicalPathAuthuser.Value = $physicalPathAuthuser.Value.Trim()
    }
}

function Test-Inputs
{
    param (
        [string] $virtualPath
    )

    if((-not [string]::IsNullOrWhiteSpace($virtualPath)) -and (-not $virtualPath.StartsWith("/")))
    {
        throw ("Virtual path should begin with a /")
    }
}

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

function Test-SSLCertificateThumbprint {
    param (
        [string] $sslCertThumbPrint,
        [string] $ipAddress,
        [string] $protocol,
        [string] $port
    )

    if($protocol -eq "https") {
        if(-not [string]::IsNullOrWhiteSpace($sslCertThumbPrint))
        {
            if([regex]::IsMatch($sslCertThumbPrint, "[^a-fA-F0-9]+"))
            {
                Write-Warning ([string]::Format("SSL Certificate thumbprint missing in the https binding : ( {0}/{1}:{2} )", $protocol, $ipAddress, $port))
            }

            $sslCertThumbPrint = [Regex]::Replace($sslCertThumbPrint, "[^a-fA-F0-9]+" , "")
            
            if(-not [regex]::IsMatch($sslCertThumbPrint, "^[a-fA-F0-9]{40}$")){
                throw ([string]::Format("Invalid thumbprint in binding ( {0}/{1}:{2} ). Length is not 40 characters or contains invalid characters.", $protocol, $ipAddress, $port))
            }

            # Mark the SSL thumbprint value to be a secret value 
            Write-Host "##vso[task.setvariable variable=f13679253bf44b74afbd244ae83ca735;isSecret=true]$sslCertThumbprint"
            return $sslCertThumbPrint
        }
        else {
            throw ([string]::Format("SSL Certificate thumbprint missing in the https binding : ( {0}/{1}:{2} )", $protocol, $ipAddress, $port))
        }
    }
}

function Validate-Bindings {
    param (
        [string] $bindings
    )
    
    $bindingsObj = $bindings | ConvertFrom-Json 

    foreach ($binding in $bindingsObj.bindings) {
        if($binding.protocol -eq "https") {
            $binding.sslThumbprint = Test-SSLCertificateThumbprint -sslCertThumbPrint $binding.sslThumbprint -ipAddress $binding.ipAddress -protocol $binding.protocol -port $binding.port
        }
    }

    return $bindingsObj.bindings
}

function Escape-SpecialChars
{
    param(
        [string]$str
    )

    return $str.Replace('`', '``').Replace('"', '`"').Replace('$', '`$')
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
        [string]$iisDeploymentType,
        [string]$action
    )

    if ([string]::IsNullOrEmpty($action)) {
        $action = "CreateOrUpdate"
    }

    Write-Host "Starting remote execution of Invoke-Main script for `"$iisDeploymentType`" with action `"$action`""

    $errorMessage = Invoke-RemoteDeployment -machinesList $machinesList -scriptToRun $scriptToRun -adminUserName $adminUserName -adminPassword $adminPassword -protocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel

    if(-not [string]::IsNullOrEmpty($errorMessage))
    {
        $helpMessage = "For more info please refer to http://aka.ms/iisextnreadme"
        Write-Error "$errorMessage`n$helpMessage"
        return
    }

    Write-Host "Successfully executed Invoke-Main script for `"$iisDeploymentType`" with action `"$action`""
}
