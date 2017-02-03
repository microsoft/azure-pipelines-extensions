Write-Verbose "Entering script AppCmdOnTargetMachines.ps1"
$AppCmdRegKey = "HKLM:\SOFTWARE\Microsoft\InetStp"

function Invoke-Appcmd
{
    param(
        [string]$command,
        [bool] $failOnErr = $true
    )

    $ErrorActionPreference = 'Continue'

    if( $psversiontable.PSVersion.Major -le 4)
    {
        $result = cmd.exe /c "`"$command`""
    }
    else
    {
        $result = cmd.exe /c "$command"
    }

    $ErrorActionPreference = 'Stop'

    if($failOnErr -and $LASTEXITCODE -ne 0)
    {
        throw $result
    }

    return $result
}

function Get-AppCmdLocation
{
    param(
        [string][Parameter(Mandatory=$true)]$regKeyPath
    )
    
    $appCmdNotFoundError = "Cannot find appcmd.exe location. Verify IIS is configured on $env:ComputerName and try operation again."
    $appCmdMinVersionError = "Version of IIS is less than 7.0 on machine $env:ComputerName. Minimum version of IIS required is 7.0"
    
    
    if(-not (Test-Path -Path $regKeyPath))
    {
        throw $appCmdNotFoundError
    }

    $regKey = Get-ItemProperty -Path $regKeyPath
    $path = $regKey.InstallPath
    $version = $regKey.MajorVersion
        
    if($version -le 6.0)
    {
        throw $appCmdMinVersionError
    }

    if( -not (Test-Path $path))
    {
        throw $appCmdNotFoundError
    }

    return (Join-Path $path appcmd.exe), $version
}

function Test-WebsiteExist
{
    param(
        [string] $siteName
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' list site /name:"{0}"',$siteName)
    $command = "`"$appCmdPath`" $appCmdArgs"
    Write-Verbose "Checking website exists. Running command : $command"

    $website = Invoke-Appcmd -command $command -failOnErr $false

    if($null -ne $website)
    {
        Write-Verbose "Website (`"$siteName`") already exists"
        return $true
    }

    Write-Verbose "Website (`"$siteName`") does not exist"
    return $false
}

function Test-BindingExist
{
    param(
        [string]$siteName,
        [string]$protocol,
        [string]$ipAddress,
        [string]$port,
        [string]$hostname
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = ' list sites'
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose "Checking binding exists for website (`"$siteName`"). Running command : $command"

    $sites = Invoke-Appcmd -command $command -failOnErr $false
    $binding = [string]::Format("{0}/{1}:{2}:{3},", $protocol, $ipAddress, $port, $hostname)

    $isBindingExists = $false

    foreach($site in $sites)
    {
        $site = $site.ToLower()
        if($site.Contains($siteName.ToLower()) -and $site.Contains($binding.ToLower()))
        {
            Write-Verbose "Given binding already exists for the current website (`"$siteName`")."
            $isBindingExists = $true
        }
        elseif($site.Contains($binding.ToLower()))
        {
            throw "Given binding already exists for a different website (`"$site`"), change the port and retry the operation."
        }
    }

    Write-Verbose "Does bindings exist for website (`"$siteName`") is : $isBindingExists"
    return $isBindingExists
}

function Test-AppPoolExist
{  
    param(
        [string]$appPoolName
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' list apppool /name:"{0}"',$appPoolName)
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose "Checking application pool exists. Running command : $command"

    $appPool = Invoke-Appcmd -command $command -failOnErr $false

    if($null -ne $appPool)
    {
        Write-Verbose "Application Pool (`"$appPoolName`") already exists"
        return $true
    }

    Write-Verbose "Application Pool (`"$appPoolName`") does not exists"
    return $false
}

function Enable-SNI
{
    param(
        [string]$siteName,
        [string]$sni,
        [string]$ipAddress,
        [string]$port,
        [string]$hostname
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey

    if( -not ($sni -eq "true" -and $iisVersion -ge 8 -and -not [string]::IsNullOrWhiteSpace($hostname)))
    {
        Write-Verbose "Not enabling SNI : sni : $sni, iisVersion : $iisVersion, hostname : $hostname. Possible Reasons: `n 1. IIS Version is less than 8 `n 2. HostName input is not provided `n 3. SNI input is set to false"
        return
    }

    if($ipAddress -eq "All Unassigned")
    {
        $ipAddress = "*"
    }

    $appCmdArgs = [string]::Format(' set site /site.name:"{0}" /bindings.[protocol=''https'',bindingInformation=''{1}:{2}:{3}''].sslFlags:"1"',$siteName, $ipAddress, $port, $hostname)
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose "Enabling SNI by setting SslFlags=1 for binding. Running command : $command"
    Invoke-Appcmd -command $command
}

function Add-SslCert
{
    param(
        [string]$port,
        [string]$certhash,
        [string]$hostname,
        [string]$sni,
        [string]$iisVersion,
        [string]$ipAddress
    )

    if([string]::IsNullOrWhiteSpace($certhash))
    {
        Write-Verbose "CertHash is empty. Returning"
        return
    }

    if($ipAddress -eq "All Unassigned")
    {
        $ipAddress = "0.0.0.0"
    }

    $result = $null
    $isItSameBinding = $false
    $addCertCmd = [string]::Empty

    #SNI is supported IIS 8 and above. To enable SNI hostnameport option should be used
    if($sni -eq "true" -and $iisVersion -ge 8 -and -not [string]::IsNullOrWhiteSpace($hostname))
    {
        $showCertCmd = [string]::Format("netsh http show sslcert hostnameport={0}:{1}", $hostname, $port)
        Write-Verbose "Checking if SslCert binding is already present. Running command : $showCertCmd"

        $result = Invoke-Appcmd -command $showCertCmd -failOnErr $false
        $isItSameBinding = $result.Get(4).Contains([string]::Format("{0}:{1}", $hostname, $port))

        $addCertCmd = [string]::Format("netsh http add sslcert hostnameport={0}:{1} certhash={2} appid={{{3}}} certstorename=MY", $hostname, $port, $certhash, [System.Guid]::NewGuid().toString())
    }
    else
    {
        $showCertCmd = [string]::Format("netsh http show sslcert ipport={0}:{1}", $ipAddress, $port)
        Write-Verbose "Checking if SslCert binding is already present. Running command : $showCertCmd"

        $result = Invoke-Appcmd -command $showCertCmd -failOnErr $false
        $isItSameBinding = $result.Get(4).Contains([string]::Format("{0}:{1}", $ipAddress, $port))
        
        $addCertCmd = [string]::Format("netsh http add sslcert ipport={0}:{1} certhash={2} appid={{{3}}} certstorename=MY", $ipAddress, $port, $certhash, [System.Guid]::NewGuid().toString())
    }

    $isItSameCert = $result.Get(5).ToLower().Contains($certhash.ToLower())

    if($isItSameBinding -and $isItSameCert)
    {
        Write-Verbose "SSL cert binding is already present. Returning"
        return
    }

    Write-Verbose "Setting SslCert for website."
    Invoke-Appcmd -command $addCertCmd
}

function Add-Website
{
    param(
        [string]$siteName,
        [string]$physicalPath
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' add site /name:"{0}" /physicalPath:"{1}"',$siteName, $physicalPath)
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose "Creating website. Running command : $command"
    Invoke-Appcmd -command $command
}

function Add-AppPool
{
    param(
        [string]$appPoolName
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' add apppool /name:"{0}"', $appPoolName)
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose "Creating application Pool. Running command : $command"
    Invoke-Appcmd -command $command
}

function Invoke-AdditionalCommand
{
    param(
        [string]$additionalCommands
    )

    $appCmdCommands = $additionalCommands.Trim('"').Split([System.Environment]::NewLine, [System.StringSplitOptions]::RemoveEmptyEntries)
    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey

    foreach($appCmdCommand in $appCmdCommands)
    {
        if(-not [string]::IsNullOrWhiteSpace($appCmdCommand.Trim(' ')))
        {
            $command = "`"$appCmdPath`" $appCmdCommand"

            Write-Verbose "Running additional command. $command"
            Invoke-Appcmd -command $command
        }
    }
}

function Update-Website
{
    param(
        [string]$siteName,
        [string]$appPoolName,
        [string]$physicalPath,
        [string]$authType,
        [System.Management.Automation.PSCredential] $websitePhysicalPathAuthCredentials,
        [string]$addBinding,
        [string]$protocol,
        [string]$ipAddress,
        [string]$port,
        [string]$hostname
    )

    $appCmdArgs = [string]::Format(' set site /site.name:"{0}"', $siteName)

    if(-not [string]::IsNullOrWhiteSpace($appPoolName))
    {
        $appCmdArgs = [string]::Format('{0} -applicationDefaults.applicationPool:"{1}"', $appCmdArgs, $appPoolName)
    }

    if(-not [string]::IsNullOrWhiteSpace($physicalPath))
    {
        $tmpPhysicalPath = $physicalPath.Replace("%SystemDrive%", "$env:SystemDrive")
        Write-Verbose "Checking website physical path exists $tmpPhysicalPath"
        if(!(Test-Path -Path $tmpPhysicalPath))
        {
            Write-Verbose "Creating website physical path $tmpPhysicalPath"
            New-Item -ItemType Directory -Path $tmpPhysicalPath
        }
        $appCmdArgs = [string]::Format("{0} -[path='/'].[path='/'].physicalPath:`"{1}`"", $appCmdArgs, $physicalPath)
    }

    if($authType -eq "WebsiteWindowsAuth") 
    {
        $userName = $websitePhysicalPathAuthCredentials.userName
        $password = $websitePhysicalPathAuthCredentials.GetNetworkCredential().password

        if(-not [string]::IsNullOrWhiteSpace($userName))
        {
            $appCmdArgs = [string]::Format("{0} -[path='/'].[path='/'].userName:{1}", $appCmdArgs, $userName)
        }

        if(-not [string]::IsNullOrWhiteSpace($password))
        {
            $appCmdArgs = [string]::Format("{0} -[path='/'].[path='/'].password:{1}", $appCmdArgs, $password)
        }
    }
    else 
    {
        $appCmdArgs = [string]::Format("{0} -[path='/'].[path='/'].userName:{1} -[path='/'].[path='/'].password:{2}", $appCmdArgs, $null, $null)
    }

    if($ipAddress -eq "All Unassigned")
    {
        $ipAddress = "*"
    }

    if($addBinding -eq "true")
    {
        $isBindingExists = Test-BindingExist -siteName $siteName -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname

        if($isBindingExists -eq $false)
        {
            $appCmdArgs = [string]::Format("{0} /+bindings.[protocol='{1}',bindingInformation='{2}:{3}:{4}']", $appCmdArgs, $protocol, $ipAddress, $port, $hostname)
        }
    }

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose "Updating website properties. Running command : $command"
    Invoke-Appcmd -command $command
}

function Update-AppPool
{
    param(
        [string]$appPoolName,
        [string]$clrVersion,
        [string]$pipeLineMode,
        [string]$identity,
        [System.Management.Automation.PSCredential] $appPoolCredentials
    )

    $appCmdArgs = ' set config  -section:system.applicationHost/applicationPools'

    if($clrVersion -ieq "No Managed Code")
    {
        $appCmdArgs = [string]::Format('{0} /[name=''"{1}"''].managedRuntimeVersion:', $appCmdArgs, $appPoolName)
    }
    elseif(-not [string]::IsNullOrWhiteSpace($clrVersion))
    {
        $appCmdArgs = [string]::Format('{0} /[name=''"{1}"''].managedRuntimeVersion:{2}', $appCmdArgs, $appPoolName, $clrVersion)
    }

    if(-not [string]::IsNullOrWhiteSpace($pipeLineMode))
    {
        $appCmdArgs = [string]::Format('{0} /[name=''"{1}"''].managedPipelineMode:{2}', $appCmdArgs, $appPoolName, $pipeLineMode)
    }

    if($identity -eq "SpecificUser" -and $appPoolCredentials)
    {
        $userName = $appPoolCredentials.UserName
        $password = $appPoolCredentials.GetNetworkCredential().password

        if (-not [string]::IsNullOrWhiteSpace($userName)) {
            $appCmdArgs = [string]::Format('{0} /[name=''"{1}"''].processModel.identityType:SpecificUser /[name=''"{1}"''].processModel.userName:"{2}"',`
                                $appCmdArgs, $appPoolName, $userName)
        }
        if (-not [string]::IsNullOrWhiteSpace($password)) {
            $appCmdArgs = [string]::Format('{0} /[name=''"{1}"''].processModel.identityType:SpecificUser /[name=''"{1}"''].processModel.password:"{2}"',`
                                $appCmdArgs, $appPoolName, $password)
        }
    }
    else
    {
        $appCmdArgs = [string]::Format('{0} /[name=''"{1}"''].processModel.identityType:{2}', $appCmdArgs, $appPoolName, $identity)
    }

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose "Updating application pool properties. Running command : $command"
    Invoke-Appcmd -command $command
}

function Add-And-Update-Website
{
    param(
        [string]$siteName,
        [string]$appPoolName,
        [string]$physicalPath,
        [string]$authType,
        [System.Management.Automation.PSCredential] $websitePhysicalPathAuthCredentials,
        [string]$addBinding,
        [string]$protocol,
        [string]$ipAddress,
        [string]$port,
        [string]$hostname
    )

    $doesWebsiteExists = Test-WebsiteExist -siteName $siteName

    if( -not $doesWebsiteExists)
    {
        Add-Website -siteName $siteName -physicalPath $physicalPath
    }

    Update-Website -siteName $siteName -appPoolName $appPoolName -physicalPath $physicalPath -authType $authType -websitePhysicalPathAuthCredentials $websitePhysicalPathAuthCredentials `
    -addBinding $addBinding -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname
}

function Add-And-Update-AppPool
{
    param(
        [string]$appPoolName,
        [string]$clrVersion,
        [string]$pipeLineMode,
        [string]$identity,
        [System.Management.Automation.PSCredential] $appPoolCredentials
    )

    $doesAppPoolExists = Test-AppPoolExist -appPoolName $appPoolName

    if(-not $doesAppPoolExists)
    {
        Add-AppPool -appPoolName $appPoolName
    }

    Update-AppPool -appPoolName $appPoolName -clrVersion $clrVersion -pipeLineMode $pipeLineMode -identity $identity -appPoolCredentials $appPoolCredentials
}

function Test-ApplicationExist {
    
    param(
        [string] [Parameter(Mandatory=$true)] $applicationName
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' list app "{0}"', $applicationName)
    $command = "`"$appCmdPath`" $appCmdArgs"
    Write-Verbose -verbose "Checking application exists. Running command : $command"

    $application = Invoke-Appcmd -command $command -failOnErr $false

    if($null -ne $application -and $application -match $applicationName)
    {
        Write-Verbose -verbose "Application (`"$applicationName`") already exists"
        return $true
    }

    Write-Verbose -verbose "Application (`"$applicationName`") does not exist"
    return $false
}

function Add-Application
{
    param(
        [string] [Parameter(Mandatory=$true)] $siteName,
        [string] [Parameter(Mandatory=$true)] $virtualPath,
        [string] [Parameter(Mandatory=$true)] $physicalPath
    )

    $tmpPhysicalPath = $physicalPath.Replace("%SystemDrive%", "$env:SystemDrive")
    Write-Verbose -verbose "Checking website physical path exists $tmpPhysicalPath"
    if(!(Test-Path -Path $tmpPhysicalPath))
    {
        Write-Verbose -verbose "Creating application physical path $tmpPhysicalPath"
        New-Item -ItemType Directory -Path $tmpPhysicalPath
    }

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' add app /site.name:"{0}" /path:"/{1}" /physicalPath:"{2}"',$siteName, $virtualPath, $physicalPath)
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose -verbose "Creating web application. Running command : $command"
    Invoke-Appcmd -command $command
}


function Update-Application 
{
    param (
        [string] [Parameter(Mandatory=$true)] $applicationName,
        [string] $physicalPath,
        [string] $applicationPool,
        [string] $physicalPathAuthentication,
        [System.Management.Automation.PSCredential] $physicalPathAuthenticationCredentials
    )

    $appCmdArgs = [string]::Format(' set app /app.name:"{0}"', $applicationName)

    if(-not [string]::IsNullOrWhiteSpace($applicationPool))
    {
        $appCmdArgs = [string]::Format('{0} -applicationPool:"{1}"', $appCmdArgs, $applicationPool)
    }

    if(-not [string]::IsNullOrWhiteSpace($physicalPath))
    {
        $tmpPhysicalPath = $physicalPath.Replace("%SystemDrive%", "$env:SystemDrive")
        Write-Verbose -verbose "Checking application physical path exists $tmpPhysicalPath"
        if(!(Test-Path -Path $tmpPhysicalPath))
        {
            Write-Verbose -verbose "Creating application physical path $tmpPhysicalPath"
            New-Item -ItemType Directory -Path $tmpPhysicalPath
        }
        $appCmdArgs = [string]::Format("{0} -[path='/'].physicalPath:`"{1}`"", $appCmdArgs, $physicalPath)
    }

    if($physicalPathAuthentication -eq "ApplicationWindowsAuth") 
    {
        $userName = $physicalPathAuthenticationCredentials.userName
        $password = $physicalPathAuthenticationCredentials.GetNetworkCredential().password

        if(-not [string]::IsNullOrWhiteSpace($userName))
        {
            $appCmdArgs = [string]::Format("{0} -[path='/'].userName:{1}", $appCmdArgs, $userName)
        }

        if(-not [string]::IsNullOrWhiteSpace($password))
        {
            $appCmdArgs = [string]::Format("{0} -[path='/'].password:{1}", $appCmdArgs, $password)
        }
    }
    else 
    {
        $appCmdArgs = [string]::Format("{0} -[path='/'].userName:{1} -[path='/'].password:{2}", $appCmdArgs, $null, $null)
    }

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose -verbose "Updating application properties. Running command : $command"
    Invoke-Appcmd -command $command
}

function Add-And-Update-Application 
{
    param (
        [string] [Parameter(Mandatory=$true)] $siteName,
        [string] [Parameter(Mandatory=$true)] $virtualPath,
        [string] [Parameter(Mandatory=$true)] $physicalPath,
        [string] $applicationPool,
        [string] $physicalPathAuthentication,
        [System.Management.Automation.PSCredential] $physicalPathAuthenticationCredentials
    )

    $applicationName = "$siteName/$virtualPath"
    $applicationExist = Test-ApplicationExist -applicationName $applicationName

    if( -not $applicationExist)
    {   
        Add-Application -siteName $siteName -virtualPath $virtualPath -physicalPath $physicalPath
    }

    Update-Application -applicationName $applicationName -physicalPath $physicalPath -applicationPool $applicationPool -physicalPathAuthentication $physicalPathAuthentication -physicalPathAuthenticationCredentials $physicalPathAuthenticationCredentials
}

function Test-VirtualDirectoryExist 
{
    param(
        [string] [Parameter(Mandatory=$true)] $virtualDirectoryName
    )

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' list vdir -vdir.name:"{0}"', $virtualDirectoryName)
    $command = "`"$appCmdPath`" $appCmdArgs"
    Write-Verbose -verbose "Checking virtual directory exists. Running command : $command"

    $virtualDirectory = Invoke-Appcmd -command $command -failOnErr $false

    if($null -ne $virtualDirectory -and $virtualDirectory -match $virtualDirectoryName)
    {
        Write-Verbose -verbose "Virtual Directory (`"$virtualDirectoryName`") already exists"
        return $true
    }

    Write-Verbose -verbose "Virtual Directory (`"$virtualDirectoryName`") does not exist"
    return $false
}

function Add-VirtualDirectory 
{
    param(
        [string] [Parameter(Mandatory=$true)] $applicationName,
        [string] [Parameter(Mandatory=$true)] $virtualPath,
        [string] [Parameter(Mandatory=$true)] $physicalPath
    )

    $tmpPhysicalPath = $physicalPath.Replace("%SystemDrive%", "$env:SystemDrive")
    Write-Verbose -verbose "Checking virtual directory physical path exists $tmpPhysicalPath"
    if(!(Test-Path -Path $tmpPhysicalPath))
    {
        Write-Verbose -verbose "Creating virtual directory physical path $tmpPhysicalPath"
        New-Item -ItemType Directory -Path $tmpPhysicalPath
    }

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $appCmdArgs = [string]::Format(' add vdir /app.name:"{0}" /path:"/{1}" /physicalPath:"{2}"',$applicationName, $virtualPath, $physicalPath)
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose -verbose "Creating web application. Running command : $command"
    Invoke-Appcmd -command $command
}

function Update-VirtualDirectory 
{
    param (
        [string] [Parameter(Mandatory=$true)] $virtualDirectoryName,
        [string] $physicalPath,
        [string] $physicalPathAuthentication,
        [System.Management.Automation.PSCredential] $physicalPathAuthenticationCredentials
    )

    $appCmdArgs = [string]::Format(' set vdir /vdir.name:"{0}"', $virtualDirectoryName)

    if(-not [string]::IsNullOrWhiteSpace($physicalPath))
    {
        $tmpPhysicalPath = $physicalPath.Replace("%SystemDrive%", "$env:SystemDrive")
        Write-Verbose -verbose "Checking virtual directory physical path exists $tmpPhysicalPath"
        if(!(Test-Path -Path $tmpPhysicalPath))
        {
            Write-Verbose -verbose "Creating virtual directory physical path $tmpPhysicalPath"
            New-Item -ItemType Directory -Path $tmpPhysicalPath
        }
        $appCmdArgs = [string]::Format("{0} -physicalPath:`"{1}`"", $appCmdArgs, $physicalPath)
    }

    if($physicalPathAuthentication -ieq "VDWindowsAuth") 
    {
        $userName = $physicalPathAuthenticationCredentials.userName
        $password = $physicalPathAuthenticationCredentials.GetNetworkCredential().password

        if(-not [string]::IsNullOrWhiteSpace($userName))
        {
            $appCmdArgs = [string]::Format("{0} -userName:{1}", $appCmdArgs, $userName)
        }

        if(-not [string]::IsNullOrWhiteSpace($password))
        {
            $appCmdArgs = [string]::Format("{0} -password:{1}", $appCmdArgs, $password)
        }
    }
    else 
    {
        $appCmdArgs = [string]::Format("{0} -userName:{1} -password:{2}", $appCmdArgs, $null, $null)
    }

    $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
    $command = "`"$appCmdPath`" $appCmdArgs"

    Write-Verbose -verbose "Updating virtual directory properties. Running command : $command"
    Invoke-Appcmd -command $command
}

function Add-And-Update-VirtualDirectory 
{
    param (
        [string] [Parameter(Mandatory=$true)] $siteName,
        [string] $applicationPath,
        [string] [Parameter(Mandatory=$true)] $virtualPath,
        [string] [Parameter(Mandatory=$true)] $physicalPath,
        [string] $physicalPathAuthentication,
        [System.Management.Automation.PSCredential] $physicalPathAuthenticationCredentials
    )

    $applicationName = "$siteName/$applicationPath"
    $virtualDirectoryName = "$applicationName/$virtualPath"
    if([string]::IsNullOrWhiteSpace($applicationPath))
    {
        $applicationName = "$siteName/"
        $virtualDirectoryName = "$applicationName$virtualPath"
    }

    $virtualDirectoryExist = Test-VirtualDirectoryExist -virtualDirectoryName $virtualDirectoryName

    if(-not $virtualDirectoryExist) 
    {
        Add-VirtualDirectory -applicationName $applicationName -virtualPath $virtualPath -physicalPath $physicalPath
    }

    Update-VirtualDirectory -virtualDirectoryName $virtualDirectoryName -physicalPath $physicalPath -physicalPathAuthentication $physicalPathAuthentication -physicalPathAuthenticationCredentials $physicalPathAuthenticationCredentials
}

function Execute-Main
{
    param (
        [string]$CreateWebsite,
        [string]$CreateApplication,
        [string]$CreateVirtualDirectory,
        [string]$CreateAppPool,

        [string]$ActionIISWebsite,
        [string]$ActionIISApplicationPool,
       
        [string]$ApplicationPath,
        [string]$VirtualPath,
        
        [string]$WebsiteName,
        [string]$PhysicalPath,
        [string]$PhysicalPathAuth,
        [System.Management.Automation.PSCredential] $PhysicalPathAuthCredentials,
        
        [string]$AddBinding,
        [string]$Protocol,
        [string]$IpAddress,
        [string]$Port,
        [string]$HostName,
        [string]$ServerNameIndication,
        [string]$SslCertThumbPrint,
        
        [string]$AppPoolName,
        [string]$DotNetVersion,
        [string]$PipeLineMode,
        [string]$AppPoolIdentity,
        [System.Management.Automation.PSCredential] $AppPoolCredentials,
        
        [string]$AppCmdCommands
    )

    Write-Verbose "Entering Execute-Main function"
    Write-Verbose "CreateWebsite = $CreateWebsite"
    Write-Verbose "CreateApplication = $CreateApplication"
    Write-Verbose "CreateVirtualDirectory = $CreateVirtualDirectory"

    Write-Verbose "ActionIISWebsite = $ActionIISWebsite"
    Write-Verbose "ActionIISApplicationPool = $ActionIISApplicationPool"

    Write-Verbose "ApplicationPath = $ApplicationPath"
    Write-Verbose "VirtualPath = $VirtualPath"

    Write-Verbose "WebsiteName = $WebsiteName"
    Write-Verbose "PhysicalPath = $PhysicalPath"
    Write-Verbose "PhysicalPathAuth = $PhysicalPathAuth"
    Write-Verbose "AddBinding = $AddBinding"
    Write-Verbose "Protocol = $Protocol"
    Write-Verbose "IpAddress = $IpAddress"
    Write-Verbose "Port = $Port"
    Write-Verbose "HostName = $HostName"
    Write-Verbose "ServerNameIndication = $ServerNameIndication"

    Write-Verbose "CreateAppPool = $CreateAppPool"
    Write-Verbose "AppPoolName = $AppPoolName"
    Write-Verbose "DotNetVersion = $DotNetVersion"
    Write-Verbose "PipeLineMode = $PipeLineMode"
    Write-Verbose "AppPoolIdentity = $AppPoolIdentity"
    Write-Verbose "AppCmdCommands = $AppCmdCommands"

    if($CreateAppPool -ieq "true" -or $ActionIISApplicationPool -ieq "CreateOrUpdateAppPool")
    {
        Add-And-Update-AppPool -appPoolName $AppPoolName -clrVersion $DotNetVersion -pipeLineMode $PipeLineMode -identity $AppPoolIdentity -appPoolCredentials $AppPoolCredentials 
    }
    else {
        $AppPoolName = $null
    }

    if($CreateWebsite -ieq "true" -or $ActionIISWebsite -ieq "CreateOrUpdateWebsite")
    {
        Add-And-Update-Website -siteName $WebsiteName -appPoolName $AppPoolName -physicalPath $PhysicalPath -authType $PhysicalPathAuth -websitePhysicalPathAuthCredentials $PhysicalPathAuthCredentials `
         -addBinding $AddBinding -protocol $Protocol -ipAddress $IpAddress -port $Port -hostname $HostName

        if($Protocol -ieq "https" -and $AddBinding -ieq "true")
        {
            $appCmdPath, $iisVersion = Get-AppCmdLocation -regKeyPath $AppCmdRegKey
            Add-SslCert -ipAddress $IpAddress -port $Port -certhash $SslCertThumbPrint -hostname $HostName -sni $ServerNameIndication -iisVersion $iisVersion
            Enable-SNI -siteName $WebsiteName -sni $ServerNameIndication -ipAddress $IpAddress -port $Port -hostname $HostName
        }
    }

    if($CreateApplication -ieq "true")
    {
        Add-And-Update-Application -siteName $WebsiteName -virtualPath $VirtualPath -physicalPath $physicalPath -applicationPool $AppPoolName -physicalPathAuthentication $PhysicalPathAuth -physicalPathAuthenticationCredentials $PhysicalPathAuthCredentials
    }

    if($CreateVirtualDirectory -ieq "true")
    {
        Add-And-Update-VirtualDirectory -siteName $WebsiteName -applicationPath $ApplicationPath -virtualPath $VirtualPath -physicalPath $physicalPath -physicalPathAuthentication $PhysicalPathAuth -physicalPathAuthenticationCredentials $PhysicalPathAuthCredentials
    }

    Invoke-AdditionalCommand -additionalCommands $AppCmdCommands
    Write-Verbose "Exiting Execute-Main function"
}
