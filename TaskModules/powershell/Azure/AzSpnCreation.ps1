[cmdletbinding(
        DefaultParameterSetName="Subscription"
    )]
param
(
    [Parameter(ParameterSetName="Subscription",Mandatory=$true, HelpMessage="Enter Azure Subscription name. You need to be Subscription Admin to execute the script")]
    [string] $subscriptionName,

    [Parameter(ParameterSetName="ManagementGroup",Mandatory=$true, HelpMessage="Enter Azure Management Group Id. You need to be Management Group Admin to execute the script")]
    [string] $managementGroupId,

    [Parameter(Mandatory=$false, HelpMessage="Provide a SPN role assignment")]
    [string] $spnRole = "owner",
    
    [Parameter(Mandatory=$false, HelpMessage="Provide Azure environment name for your subscription")]
    [string] $environmentName = "AzureCloud",

    [Parameter(Mandatory=$false, HelpMessage="Provide AzureStackManagementURL to add AzureStack environment to AzureRmEnvironments.")]
    [string] $azureStackManagementURL
)
$scopeLevel = $PSCmdlet.ParameterSetName

$AZURESTACK_ENVIRONMENT = "AzureStack"

function Get-ProxyUri
{
    param([String] [Parameter(Mandatory=$true)] $serverUrl)
    
    $proxyUri = [Uri]$null
    $proxy = [System.Net.WebRequest]::GetSystemWebProxy()
    if ($proxy)
    {
        $proxy.Credentials = [System.Net.CredentialCache]::DefaultCredentials
        $proxyUri = $proxy.GetProxy("$serverUrl")
    }

    return $proxyUri
}

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

    Write-Verbose -Verbose "Retrieving endpoints from the $ResourceManagerEndpoint"

    $proxyUri = Get-ProxyUri $azureStackEndpointUri

    if ($proxyUri -eq $azureStackEndpointUri)
    {
        Write-Verbose -Verbose "No proxy settings"
        $endpointData = Invoke-RestMethod -Uri $azureStackEndpointUri -Method Get -ErrorAction Stop
    }
    else
    {
        Write-Verbose -Verbose "Using Proxy settings"
        $endpointData = Invoke-RestMethod -Uri $azureStackEndpointUri -Method Get -Proxy $proxyUri -ErrorAction Stop 
    }   

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

    $armEnv = Get-AzEnvironment -Name $name
    if($armEnv -ne $null) {
        Write-Verbose "Updating AzureRm environment $name" -Verbose
        Remove-AzEnvironment -Name $name | Out-Null
    }
    else {
        Write-Verbose "Adding AzureRm environment $name" -Verbose
    }

    return Add-AzEnvironment @azureEnvironmentParams
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
    Add-Type -AssemblyName System.Web
    $password = [System.Web.Security.Membership]::GeneratePassword(40, 3)
    $password = ConvertTo-SecureString $password -AsPlainText -Force

    return $password
}

#Initialize
$ErrorActionPreference = "Stop"
$VerbosePreference = "SilentlyContinue"
$userName = ($env:USERNAME).Replace(' ', '')
$newguid = [guid]::NewGuid()
$displayName = [String]::Format("AzureDevOps.{0}.{1}", $userName, $newguid)
$homePage = "http://" + $displayName
$identifierUri = $homePage


#Initialize subscription
$isAzureModulePresent = Get-Module -Name Az* -ListAvailable
if ([String]::IsNullOrEmpty($isAzureModulePresent) -eq $true)
{
    Write-Output "Script requires Az module to be present. Obtain Az module from https://github.com/Azure/azure-powershell/releases." -Verbose
    return
}

Import-Module -Name Az

if ($environmentName -like $AZURESTACK_ENVIRONMENT)
{
    if(-not $azureStackManagementURL)
    {
        $azureStackEnvironment = Get-AzEnvironment -Name $AZURESTACK_ENVIRONMENT
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

if ($scopeLevel.equals("Subscription"))
{
    Write-Output "Provide your credentials to access Azure subscription $subscriptionName" -Verbose
    Login-AzAccount -SubscriptionName $subscriptionName -EnvironmentName $environmentName
    $azureSubscription = Get-AzSubscription -SubscriptionName $subscriptionName
    $connectionName = $azureSubscription.SubscriptionName
    $tenantId = $azureSubscription.TenantId
    $id = $azureSubscription.SubscriptionId
}
else
{
    Write-Output "Provide your credentials to access Azure Management Group $managementGroupId" -Verbose
    Connect-AzAccount
    $azureManagementGroup = Get-AzManagementGroup -GroupName $managementGroupId
    $connectionName = $azureManagementGroup.DisplayName
    $tenantId = $azureManagementGroup.TenantId
    $id = $azureManagementGroup.Name
}


#Create a new AD Application
Write-Output "Creating a new Application in AAD (App URI - $identifierUri)" -Verbose
$servicePrincipalKey = Get-Password
$azureAdApplication = New-AzADApplication -DisplayName $displayName -HomePage $homePage -IdentifierUris $identifierUri -Password $servicePrincipalKey -Verbose
$appId = $azureAdApplication.ApplicationId
Write-Output "Azure AAD Application creation completed successfully (Application Id: $appId)" -Verbose


#Create new SPN
Write-Output "Creating a new SPN" -Verbose
$spn = New-AzADServicePrincipal -ApplicationId $appId
$spnName = $spn.ServicePrincipalNames
Write-Output "SPN creation completed successfully (SPN Name: $spnName)" -Verbose


#Assign role to SPN
Write-Output "Waiting for SPN creation to reflect in Directory before Role assignment"
Start-Sleep 30
Write-Output "Assigning role ($spnRole) to SPN App ($appId)" -Verbose

if ($scopeLevel.equals("Subscription"))
{
    New-AzRoleAssignment -RoleDefinitionName $spnRole -ServicePrincipalName $appId
}
else
{
    $scope = "/providers/Microsoft.Management/managementGroups/" + $managementGroupId
    New-AzRoleAssignment -RoleDefinitionName $spnRole -ServicePrincipalName $appId -Scope $scope
}

Write-Output "SPN role assignment completed successfully" -Verbose


#Print the values
Write-Output "`nCopy and Paste below values for Service Connection" -Verbose
Write-Output "***************************************************************************"
Write-Output "Connection Name: $connectionName(SPN)"
Write-Output "Environment: $environmentName"
Write-Output "Scope Level: $scopeLevel"
if ($scopeLevel.equals("Subscription"))
{
    Write-Output "Subscription Id: $id"
    Write-Output "Subscription Name: $connectionName"
}
else
{
   Write-Output "Management Group Id: $id"
   Write-Output "Management Group Name: $connectionName" 
}


$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($servicePrincipalKey)
$spnKey_plaintext = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

Write-Output "Service Principal Id: $appId"
Write-Output "Service Principal key: $spnKey_plaintext"
Write-Output "Tenant Id: $tenantId"
Write-Output "***************************************************************************"

