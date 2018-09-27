[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\ManageIISWebApp.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$invalidCertMsg = "Invalid thumbprint. Length is not 40 characters or contains invalid characters."

# Test 1: Should throw exception, Should throw when createWebsite true and sitename empty
$errorMsg = "Website Name cannot be empty if you want to create or update the target website."
Assert-Throws { Validate-Inputs -createWebsite "true" -websiteName " " -createAppPool "true" -appPoolName "dummyapppool" } $errorMsg

# Test 2: Should not throw exception, Should not throw when createWebsite true and sitename is not empty
try
{
    $result = Validate-Inputs -createWebsite "true" -websiteName "dummywebsite" -createAppPool "true" -appPoolName "dummyapppool"
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception

# Test 3: Should throw exception, Should throw when createAppPool true and app pool name empty
$errorMsg = "Application pool name cannot be empty if you want to create or update the target app pool."
Assert-Throws { Validate-Inputs -createWebsite "false" -websiteName "dummysite" -createAppPool "true" -appPoolName " " } $errorMsg

# Test 4: Should not throw exception, Should not throw when createAppPool true and app pool name not empty
try
{
    $result = Validate-Inputs -createWebsite "false" -websiteName "dummywebsite" -createAppPool "true" -appPoolName "dummyapppool"
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception

# Test 5: Should not throw exception, Should not throw when createWebsite false and createAppPool false
try
{
    $result = Validate-Inputs -createWebsite "false" -websiteName " " -createAppPool "false" -appPoolName " "
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception

# Test 6: Should throw exception, Should throw when sslCertThumbPrint is greater than 40 character length
$thumbprint = "de86af66a9624ddbc3a1055f937be9c000d6b8a11" #contains one char extra at end
Assert-Throws { Validate-Inputs -createWebsite "faslse" -createAppPool "false" -addBinding "true" -protocol "https" -sslCertThumbPrint $thumbprint } $invalidCertMsg

# Test 7: Should throw exception, Should throw when sslCertThumbPrint is less than 40 character length
$thumbprint = "de86af66a9624ddbc3a1055f937be9c000d6b8a" #contains one char less
Assert-Throws { Validate-Inputs -createWebsite "faslse" -createAppPool "false" -addBinding "true" -protocol "https" -sslCertThumbPrint $thumbprint } $invalidCertMsg

# Test 8: Should throw exception, Should throw when sslCertThumbPrint contains non hexadecimal characters
$thumbprint = "de86af66a9624ddbc3a1055f937be9c000d6b8ag" #last char is 'g'
Assert-Throws { Validate-Inputs -createWebsite "faslse" -createAppPool "false" -addBinding "true" -protocol "https" -sslCertThumbPrint $thumbprint } $invalidCertMsg

# Test 9: Should throw exception, Should throw when sslCertThumbPrint contains spaces between hexadecimal numbers
$thumbprint = "de 86 af 66 a9 62 4d db c3 a1 05 5f 93 7b e9 c0 00 d6 b8 a1"
Assert-Throws { Validate-Inputs -createWebsite "faslse" -createAppPool "false" -addBinding "true" -protocol "https" -sslCertThumbPrint $thumbprint } $invalidCertMsg

# Test 10: Should throw exception, Should throw when sslCertThumbPrint contains invisible characters
$thumbprint = "‎de86af66a9624ddbc3a1055f937be9c000d6b8a1" #contains invisible character at the start. You can move the cursor using arrow keys to figure it out
Assert-Throws { Validate-Inputs -createWebsite "faslse" -createAppPool "false" -addBinding "true" -protocol "https" -sslCertThumbPrint $thumbprint } $invalidCertMsg

# Test 11: Should not throw exception, Should not throw when addBinding is false
$thumbprint = "invalid-thumbprint"
try
{
    $result = Validate-Inputs -createWebsite "false" -createAppPool "false" -addBinding "false" -sslCertThumbPrint $thumbprint
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception

# Test 12: Should not throw exception, Should not throw when protocol is http
$thumbprint = "invalid-thumbprint"
try
{
    $result = Validate-Inputs -createWebsite "false" -createAppPool "false" -protocol "http" -sslCertThumbPrint $thumbprint
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception
