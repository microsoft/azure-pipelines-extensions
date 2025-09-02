Trace-VstsEnteringInvocation $MyInvocation
Import-VstsLocStrings "$PSScriptRoot\Task.json"

. $PSScriptRoot/Constants.ps1
Import-Module $PSScriptRoot\StorageAccountOperations.psm1
Import-Module $PSScriptRoot\AzurePIROperations.psm1
Import-Module $PSScriptRoot\Utils.psm1

# Get inputs.
$connectedServiceName = Get-VstsInput -Name ConnectedServiceName -Require
$action = Get-VstsInput -Name Action -Require
if ($action -eq "CreateOrUpdate") {
    $storageAccountName = Get-VstsInput -Name StorageAccountName -Require
    $containerName = Get-VstsInput -Name ContainerName -Require
    $storageBlobName = Get-VstsInput -Name StorageBlobName -Require
    $extensionPackagePath = Get-VstsInput -Name ExtensionPackage -Require
    $extensionDefinitionFilePath = Get-VstsInput -Name ExtensionDefinitionFile -Require
    $newVersionVarName = Get-VstsInput -Name NewVersion
    $prependVersionToBlobName = Get-VstsInput -Name PrependVersionFromManifestToBlobName
}
if ($action -eq "Promote") {
    $storageAccountName = Get-VstsInput -Name StorageAccountName -Require
    $containerName = Get-VstsInput -Name ContainerName -Require
    $storageBlobName = Get-VstsInput -Name StorageBlobName -Require
    $extensionDefinitionFilePath = Get-VstsInput -Name ExtensionDefinitionFile -Require
    $newVersionVarName = Get-VstsInput -Name NewVersion
    $regions = Get-VstsInput -Name Regions
    $prependVersionToBlobName = Get-VstsInput -Name PrependVersionFromManifestToBlobName
}
if ($action -eq "Delete") {
    $fullExtensionName = Get-VstsInput -Name FullExtensionName -Require
    $extensionVersion = Get-VstsInput -Name Version -Require
    $publisherName = $fullExtensionName.Substring(0, $fullExtensionName.LastIndexOf("."))
    $extensionName = $fullExtensionName.Substring($fullExtensionName.LastIndexOf(".") + 1)
}

# Validate the extension definition file path does not contains new-lines. Otherwise, it will
# break invoking the script via Invoke-Expression.
if (-not([string]::IsNullOrWhitespace($extensionDefinitionFilePath)) -and $extensionDefinitionFilePath -match '[\r\n]') {
    throw (Get-VstsLocString -Key InvalidScriptPath0 -ArgumentList $extensionDefinitionFilePath)
}

function Get-ServiceEndpointDetails {
    param([string][Parameter(Mandatory = $true)]$connectedServiceName)
    
    $endpoint = Get-VstsEndpoint -Name $connectedServiceName
    return $endpoint
}

function Update-MediaLink {
    param([Parameter(Mandatory = $true)]$extensionDefinitionFilePath,
        [string][Parameter(Mandatory = $true)]$storageAccountName,
        [string][Parameter(Mandatory = $true)]$containerName,
        [string][Parameter(Mandatory = $true)]$storageBlobName)

        [xml]$extensionDefinitionXml = Get-Content -Path $extensionDefinitionFilePath
        $mediaLink = "https://{0}.blob.core.windows.net/{1}/{2}" -f $storageAccountName, $containerName, $storageBlobName
        $extensionDefinitionXml.ExtensionImage.MediaLink = $mediaLink
        return $extensionDefinitionXml
}

function PrependVersionToBlobName {
    param([Parameter(Mandatory = $true)]$extensionDefinitionFilePath,
        [string][Parameter(Mandatory = $true)]$storageBlobName)

        [xml]$extensionDefinitionXml = Get-Content -Path $extensionDefinitionFilePath
        if(!$extensionDefinitionXml.ExtensionImage.Version) {
            throw (Get-VstsLocString -Key "VMExtPIR_VersionMissingInManifestFile")
        }
        $extensionVersion = $extensionDefinitionXml.ExtensionImage.Version
        return ("{0}_{1}" -f $extensionVersion, $storageBlobName)
}

function Upload-ExtensionPackageToStorageBlob {
    param([string][Parameter(Mandatory = $true)]$subscriptionId,
        [string][Parameter(Mandatory = $true)]$storageAccountName,
        [string][Parameter(Mandatory = $true)]$containerName,
        [string][Parameter(Mandatory = $true)]$packagePath,
        [string][Parameter(Mandatory = $true)]$storageBlobName,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate)

    Ensure-StorageAccountExists -subscriptionId $subscriptionId -storageAccountName $storageAccountName -certificate $certificate
    $storageAccountKey = Get-PrimaryStorageAccountKey -subscriptionId $subscriptionId -storageAccountName $storageAccountName -certificate $certificate
    Ensure-ContainerExists -storageAccountName $storageAccountName -containerName $containerName -storageAccountKey $storageAccountKey
    Set-StorageBlobContent -storageAccountName $storageAccountName -containerName $containerName -storageBlobName $storageBlobName -packagePath $packagePath -storageAccountKey $storageAccountKey
}

function CreateOrUpdate-ExtensionPackageInAzurePIR {
    param([string][Parameter(Mandatory = $true)]$subscriptionId,
        [string][Parameter(Mandatory = $true)]$storageAccountName,
        [string][Parameter(Mandatory = $true)]$containerName,
        [string][Parameter(Mandatory = $true)]$storageBlobName,
        [string][Parameter(Mandatory = $true)]$extensionDefinitionFilePath,
        [string][Parameter(Mandatory = $false)]$newVersionVarName,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate)

    # update media link in the extension definition file
    $extensionDefinitionXml = Update-MediaLink -extensionDefinitionFilePath $extensionDefinitionFilePath -storageAccountName $storageAccountName -containerName $containerName -storageBlobName $storageBlobName
    $extensionExistsInPIR = $false
    $extensionExistsInPIR = Check-ExtensionExistsInAzurePIR -subscriptionId $subscriptionId -certificate $certificate -publisher $extensionDefinitionXml.ExtensionImage.ProviderNameSpace -type $extensionDefinitionXml.ExtensionImage.Type
    if ($extensionExistsInPIR) {
        Update-ExtensionPackageInAzurePIR -extensionDefinitionXml $extensionDefinitionXml -certificate $certificate -subscriptionId $subscriptionId
    }
    else {
        $extensionDefinitionXml.ExtensionImage.Version = "1.0.0.0"
        Create-ExtensionPackageInAzurePIR -extensionDefinitionXml $extensionDefinitionXml -certificate $certificate -subscriptionId $subscriptionId
    }
    if ($newVersionVarName) {
        # set this version as value for release variable 
        $newVersion = $extensionDefinitionXml.ExtensionImage.Version
        $newVersionVariable = $newVersionVarName
        Write-Host "##vso[task.setvariable variable=$newVersionVariable;]$newVersion"
    }
}

function Promote-ExtensionPackageInAzurePIR {
    param([string][Parameter(Mandatory = $true)]$subscriptionId,
        [string][Parameter(Mandatory = $true)]$storageAccountName,
        [string][Parameter(Mandatory = $true)]$containerName,
        [string][Parameter(Mandatory = $true)]$storageBlobName,
        [string][Parameter(Mandatory = $true)]$extensionDefinitionFilePath,
        [string][Parameter(Mandatory = $false)]$newVersionVarName,
        [string][Parameter(Mandatory = $false)]$regions,
        [System.Security.Cryptography.X509Certificates.X509Certificate2][Parameter(Mandatory = $true)]$certificate)

    $extensionDefinitionXml = Update-MediaLink -extensionDefinitionFilePath $extensionDefinitionFilePath -storageAccountName $storageAccountName -containerName $containerName -storageBlobName $storageBlobName
    $extensionExistsInPIR = $false
    $extensionExistsInPIR = Check-ExtensionExistsInAzurePIR -subscriptionId $subscriptionId -certificate $certificate -publisher $extensionDefinitionXml.ExtensionImage.ProviderNameSpace -type $extensionDefinitionXml.ExtensionImage.Type
    if ($extensionExistsInPIR) {
        # update the extension definition file
        $extensionDefinitionXml.ExtensionImage.IsInternalExtension = "false"
        if($regions.Trim()) {
            $regionsElement = $extensionDefinitionXml.CreateElement("Regions", $extensionDefinitionXml.ExtensionImage.NamespaceURI)
            $extensionDefinitionXml.ExtensionImage.AppendChild($regionsElement)
            $extensionDefinitionXml.ExtensionImage.Regions = $regions
        }
        Update-ExtensionPackageInAzurePIR -extensionDefinitionXml $extensionDefinitionXml -certificate $certificate -subscriptionId $subscriptionId
    }
    else {
        throw (Get-VstsLocString -Key "VMExtPIR_CreateExtensionBeforePromote")
    }
    if ($newVersionVarName) {
        # set this version as value for release variable 
        $newVersion = $extensionDefinitionXml.ExtensionImage.Version
        $newVersionVariable = $newVersionVarName
        Write-Host "##vso[task.setvariable variable=$newVersionVariable;]$newVersion"
    }
}

$serviceEndpointDetails = Get-ServiceEndpointDetails -connectedServiceName $connectedServiceName
$bytes = [System.Convert]::FromBase64String($serviceEndpointDetails.Auth.parameters.certificate)
$certificate = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
$certificate.Import($bytes, $null, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::UserKeySet)

$subscriptionId = $serviceEndpointDetails.Data.subscriptionId
if($prependVersionToBlobName){
    $storageBlobName = PrependVersionToBlobName -extensionDefinitionFilePath $extensionDefinitionFilePath -storageBlobName $storageBlobName
}
if ($action -eq "CreateOrUpdate") {
    Upload-ExtensionPackageToStorageBlob -subscriptionId $subscriptionId -storageAccountName $storageAccountName -containerName $containerName -packagePath $extensionPackagePath -storageBlobName $storageBlobName -certificate $certificate
    Write-Host (Get-VstsLocString -Key "VMExtPIR_BlobUploadSuccess")
    CreateOrUpdate-ExtensionPackageInAzurePIR -subscriptionId $subscriptionId -storageAccountName $storageAccountName -containerName $containerName -storageBlobName $storageBlobName -extensionDefinitionFilePath $extensionDefinitionFilePath -certificate $certificate -newVersionVarName $newVersionVarName
    Write-Host (Get-VstsLocString -Key "VMExtPIR_PIRCreateUpdateSuccess")
}
elseif ($action -eq "Delete") {
    Delete-ExtensionPackageFromAzurePIR  -extensionName $extensionName -publisher $publisherName -versionToDelete $extensionVersion -certificate $certificate -subscriptionId $subscriptionId
    Write-Host (Get-VstsLocString -Key "VMExtPIR_PIRDeleteSuccess" -ArgumentList $extensionName, $extensionVersion)
}
elseif ($action -eq "Promote") {
    Promote-ExtensionPackageInAzurePIR -subscriptionId $subscriptionId -storageAccountName $storageAccountName -containerName $containerName -storageBlobName $storageBlobName -extensionDefinitionFilePath $extensionDefinitionFilePath -certificate $certificate -newVersionVarName $newVersionVarName -regions $regions
    Write-Host (Get-VstsLocString -Key "VMExtPIR_PIRPromoteSuccess" -ArgumentList $regions)
}
else {
    throw (Get-VstsLocString -Key "VMExtPIR_InvalidAction" -ArgumentList $action)
}
