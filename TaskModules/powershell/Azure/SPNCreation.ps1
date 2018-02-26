param
(
    [Parameter(Mandatory=$true, HelpMessage="Enter Azure Subscription name. You need to be Subscription Admin to execute the script")]
    [string] $subscriptionName,

    [Parameter(Mandatory=$true, HelpMessage="Provide a password for SPN application that you would create; this becomes the service principal's security key")]
    [securestring] $password,

    [Parameter(Mandatory=$false, HelpMessage="Provide a SPN role assignment")]
    [string] $spnRole = "owner",
    
    [Parameter(Mandatory=$false, HelpMessage="Provide Azure environment name for your subscription")]
    [string] $environmentName = "AzureCloud",

    [Parameter(Mandatory=$false, HelpMessage="Provide AzureStackManagementURL to add AzureStack environment to AzureRmEnvironments.")]
    [string] $azureStackManagementURL
)

$AZURESTACK_ENVIRONMENT = "AzureStack"

function Add-AzureStackToAzureRmEnvironment {
    param (
        [Parameter(mandatory=$true, HelpMessage="The Admin ARM endpoint URI of the Azure Stack Environment")]
        $EndpointURI,
        [parameter(mandatory=$true, HelpMessage="Azure Stack environment name for use with AzureRM commandlets")]
        [string] $Name
    )

    $EndpointURI = $EndpointURI.TrimEnd("/")

    $Domain = ""
    try {
        $uriendpoint = [System.Uri] $EndpointURI
        $i = $EndpointURI.IndexOf('.')
        $Domain = ($EndpointURI.Remove(0,$i+1)).TrimEnd('/')
    }
    catch {
        Write-Error (Get-VstsLocString -Key AZ_InvalidARMEndpoint)
    }

    $ResourceManagerEndpoint = $EndpointURI
    $stackdomain = $Domain

    $AzureKeyVaultDnsSuffix="vault.$($stackdomain)".ToLowerInvariant()
    $AzureKeyVaultServiceEndpointResourceId= $("https://vault.$stackdomain".ToLowerInvariant())
    $StorageEndpointSuffix = ($stackdomain).ToLowerInvariant()


    $azureStackEndpointUri = $EndpointURI.ToString() + "/metadata/endpoints?api-version=2015-01-01"

    Write-Verbose "Retrieving endpoints from the $ResourceManagerEndpoint"
        
    $endpointData = Invoke-RestMethod -Uri $azureStackEndpointUri -Method Get -ErrorAction Stop
        

    if ($endpointData)
    {
        $authenticationData = $endpointData.authentication;
        if ($authenticationData)
        {
            $loginEndpoint = $authenticationData.loginEndpoint
            $aadAuthorityEndpoint = [string]::Empty

            if($loginEndpoint)
            {
                $aadAuthorityEndpoint = $loginEndpoint
                $activeDirectoryEndpoint = $loginEndpoint.TrimEnd('/') + "/"
            }

            $audiences = $authenticationData.audiences
            if($audiences.Count -gt 0)
            {
                $activeDirectoryServiceEndpointResourceId = $audiences[0]
            }
        }

        $graphEndpoint = $endpointData.graphEndpoint
        $graphAudience = $endpointData.graphEndpoint
        $galleryEndpoint = $endpointData.galleryEndpoint
    }

    $azureEnvironmentParams = @{
        Name                                     = $Name
        ActiveDirectoryEndpoint                  = $activeDirectoryEndpoint
        ActiveDirectoryServiceEndpointResourceId = $activeDirectoryServiceEndpointResourceId
        ResourceManagerEndpoint                  = $ResourceManagerEndpoint
        GalleryEndpoint                          = $galleryEndpoint
        GraphEndpoint                            = $graphEndpoint
        GraphAudience                            = $graphAudience
        StorageEndpointSuffix                    = $StorageEndpointSuffix
        AzureKeyVaultDnsSuffix                   = $AzureKeyVaultDnsSuffix
        AzureKeyVaultServiceEndpointResourceId   = $AzureKeyVaultServiceEndpointResourceId
        EnableAdfsAuthentication                 = $aadAuthorityEndpoint.TrimEnd("/").EndsWith("/adfs", [System.StringComparison]::OrdinalIgnoreCase)
    }

    $armEnv = Get-AzureRmEnvironment -Name $name
    if($armEnv -ne $null) {
        Write-Verbose "Updating AzureRm environment $name" -Verbose
        Remove-AzureRmEnvironment -Name $name | Out-Null
    }
    else {
        Write-Verbose "Adding AzureRm environment $name" -Verbose
    }

    return Add-AzureRmEnvironment @azureEnvironmentParams
}


function Get-AzureCmdletsVersion
{
    $module = Get-Module AzureRM -ListAvailable
    if($module)
    {
        return ($module).Version
    }
    return (Get-Module Azure -ListAvailable).Version
}

function Get-Password
{
    $currentAzurePSVersion = Get-AzureCmdletsVersion
    $azureVersion511 = New-Object System.Version(5, 1, 1)

    if($currentAzurePSVersion -and $currentAzurePSVersion -ge $azureVersion511)
    {
        return $password
    }
    else
    {
        $basicPassword = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($basicPassword)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($basicPassword)

        return $plainPassword
    }
}


if ($environmentName -like $AZURESTACK_ENVIRONMENT)
{
    if(-not $azureStackManagementURL)
    {
        $azureStackEnvironment = Get-AzureRmEnvironment -Name $AZURESTACK_ENVIRONMENT
        if(-not $azureStackEnvironment)
        {
            throw "AzureStack Enviornment is not present in AzureRmEnvironments in current PS Session. Please provide AzureStackManagementURL as argument or add AzureStack to AzureRmEnvironments manually."
        }
    }
    else
    {
        try
        {
            Add-AzureStackToAzureRmEnvironment -EndpointURI $azureStackManagementURL -Name $AZURESTACK_ENVIRONMENT
        }
        catch
        {
            Write-Output "ERROR: Failed to add AzureStack environment to AzureRmEnvironments";
            throw $_.Exception
        }
    }
}


#Initialize
$ErrorActionPreference = "Stop"
$VerbosePreference = "SilentlyContinue"
$userName = ($env:USERNAME).Replace(' ', '')
$newguid = [guid]::NewGuid()
$displayName = [String]::Format("VSTS.{0}.{1}", $userName, $newguid)
$homePage = "http://" + $displayName
$identifierUri = $homePage


#Initialize subscription
$isAzureModulePresent = Get-Module -Name AzureRM* -ListAvailable
if ([String]::IsNullOrEmpty($isAzureModulePresent) -eq $true)
{
    Write-Output "Script requires AzureRM modules to be present. Obtain AzureRM from https://github.com/Azure/azure-powershell/releases. Please refer https://github.com/Microsoft/vsts-tasks/blob/master/Tasks/DeployAzureResourceGroup/README.md for recommended AzureRM versions." -Verbose
    return
}

Import-Module -Name AzureRM.Profile
Write-Output "Provide your credentials to access Azure subscription $subscriptionName" -Verbose
Login-AzureRmAccount -SubscriptionName $subscriptionName -EnvironmentName $environmentName
$azureSubscription = Get-AzureRmSubscription -SubscriptionName $subscriptionName
$connectionName = $azureSubscription.SubscriptionName
$tenantId = $azureSubscription.TenantId
$id = $azureSubscription.SubscriptionId


#Create a new AD Application
Write-Output "Creating a new Application in AAD (App URI - $identifierUri)" -Verbose
$versionSpecificPassword = Get-Password
$azureAdApplication = New-AzureRmADApplication -DisplayName $displayName -HomePage $homePage -IdentifierUris $identifierUri -Password $versionSpecificPassword -Verbose
$appId = $azureAdApplication.ApplicationId
Write-Output "Azure AAD Application creation completed successfully (Application Id: $appId)" -Verbose


#Create new SPN
Write-Output "Creating a new SPN" -Verbose
$spn = New-AzureRmADServicePrincipal -ApplicationId $appId
$spnName = $spn.ServicePrincipalName
Write-Output "SPN creation completed successfully (SPN Name: $spnName)" -Verbose


#Assign role to SPN
Write-Output "Waiting for SPN creation to reflect in Directory before Role assignment"
Start-Sleep 20
Write-Output "Assigning role ($spnRole) to SPN App ($appId)" -Verbose
New-AzureRmRoleAssignment -RoleDefinitionName $spnRole -ServicePrincipalName $appId
Write-Output "SPN role assignment completed successfully" -Verbose


#Print the values
Write-Output "`nCopy and Paste below values for Service Connection" -Verbose
Write-Output "***************************************************************************"
Write-Output "Connection Name: $connectionName(SPN)"
Write-Output "Environment: $environmentName"
Write-Output "Subscription Id: $id"
Write-Output "Subscription Name: $connectionName"
Write-Output "Service Principal Id: $appId"
Write-Output "Service Principal key: <Password that you typed in>"
Write-Output "Tenant Id: $tenantId"
Write-Output "***************************************************************************"
