#################################################################################################################################
#  Name        : Configure-WinRM.ps1                                                                                            #
#                                                                                                                               #
#  Description : Configures the WinRM on a local machine                                                                        #
#                                                                                                                               #
#  Arguments   : HostName, specifies the ipaddress or FQDN of machine                                                           #
#################################################################################################################################

param
(
    [string] $hostname,
    [string] $protocol
)

#################################################################################################################################
#                                             Helper Functions                                                                  #
#################################################################################################################################

$ErrorActionPreference="Stop"
$winrmHttpPort=5985
$winrmHttpsPort=5986

$helpMsg = "Usage:
            To configure WinRM over Https:
                ./ConfigureWinRM.ps1 <fqdn\ipaddress> https

            To configure WinRM over Http:
                ./ConfigureWinRM.ps1 <fqdn\ipaddress> http"


function Is-InputValid
{  
    $isInputValid = $true

    if(-not $hostname -or ($protocol -ne "http" -and $protocol -ne "https"))
    {
        $isInputValid = $false
    }

    return $isInputValid
}

function Delete-WinRMListener
{
    $config = winrm enumerate winrm/config/listener
    foreach($conf in $config)
    {
        if($conf.Contains("HTTPS"))
        {
            Write-Verbose -Verbose "HTTPS is already configured. Deleting the exisiting configuration."

            winrm delete winrm/config/Listener?Address=*+Transport=HTTPS
            break
        }
    }
}

function Configure-WinRMListener
{
    Write-Verbose -Verbose "Configuring the WinRM listener for $hostname over $protocol protocol. This operation takes little longer time, please wait..."

    if($protocol -ne "http")
    {
            Configure-WinRMHttpsListener -hostname $hostname -port $winrmHttpsPort
    }
    else
    {
            Configure-WinRMHttpListener
    }
    
    Write-Verbose -Verbose "Successfully Configured the WinRM listener for $hostname over $protocol protocol" 
}

function Configure-WinRMHttpListener
{
    winrm delete winrm/config/Listener?Address=*+Transport=HTTP
    winrm create winrm/config/Listener?Address=*+Transport=HTTP
}

function Configure-WinRMHttpsListener
{
    # Delete the WinRM Https listener if it is already configured
    Delete-WinRMListener

    # Create a test certificate
    $thumbprint = (Get-ChildItem cert:\LocalMachine\My | Where-Object { $_.Subject -eq "CN=" + $hostname } | Select-Object -Last 1).Thumbprint
    if(-not $thumbprint)
    {
        if(-not (Test-Path -Path .\makecert.exe))
        {
            throw "File not found: makecert.exe"
        }
		
		# Create Sliding Window for Expiration
		$currentDate = get-date
		$expirationDate = $currentDate.AddYears(10)
		
		# Formatting
		$startDateString = $currentDate.ToString("MM/dd/yyyy")
		$endDateString = $expirationDate.ToString("MM/dd/yyyy")

		# Use makecert to generate certificate
		.\makecert -r -pe -n CN=$hostname -b $startDateString -e $endDateString -eku 1.3.6.1.5.5.7.3.1 -ss my -sr localmachine -sky exchange -sp "Microsoft RSA SChannel Cryptographic Provider" -sy 12

        $thumbprint=(Get-ChildItem cert:\Localmachine\my | Where-Object { $_.Subject -eq "CN=" + $hostname } | Select-Object -Last 1).Thumbprint

        if(-not $thumbprint)
        {
            throw "Failed to create the test certificate."
        }
    }
    
    # Configure WinRM
    $WinrmCreate= "winrm create --% winrm/config/Listener?Address=*+Transport=HTTPS @{Hostname=`"$hostName`";CertificateThumbprint=`"$thumbPrint`"}"
    invoke-expression $WinrmCreate
    winrm set winrm/config/service/auth '@{Basic="true"}'
}

function Add-FirewallException
{
    if( $protocol -ne "http")
    {
        $port = $winrmHttpsPort
    }
    else
    {
        $port = $winrmHttpPort
    }

    # Delete an exisitng rule
    Write-Verbose -Verbose "Deleting the existing firewall exception for port $port"
    netsh advfirewall firewall delete rule name="Windows Remote Management (HTTPS-In)" dir=in protocol=TCP localport=$port | Out-Null

    # Add a new firewall rule
    Write-Verbose -Verbose "Adding the firewall exception for port $port"
    netsh advfirewall firewall add rule name="Windows Remote Management (HTTPS-In)" dir=in action=allow protocol=TCP localport=$port | Out-Null
}


#################################################################################################################################
#                                              Configure WinRM                                                                  #
#################################################################################################################################

# Validate script arguments
if(-not (Is-InputValid))
{
    Write-Warning "Invalid Argument exception:"
    Write-Host $helpMsg

    return
}

netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=yes
winrm quickconfig

# The default MaxEnvelopeSizekb on Windows Server is 500 Kb which is very less. It needs to be at 8192 Kb. The small envelop size if not changed
# results in WS-Management service responding with error that the request size exceeded the configured MaxEnvelopeSize quota.
winrm set winrm/config '@{MaxEnvelopeSizekb = "8192"}'


# Configure WinRM listener
Configure-WinRMListener

# Add firewall exception
Add-FirewallException

# List the listeners
Write-Verbose -Verbose "Listing the WinRM listeners:"

Write-Verbose -Verbose "Querying WinRM listeners by running command: winrm enumerate winrm/config/listener"
winrm enumerate winrm/config/listener

#################################################################################################################################
#################################################################################################################################
