[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\Utility.ps1

$parentWebsiteNameForVD = "Sample Web Site"
$virtualPathForVD = "/App/Vdir"
$physicalPathForVD = "Drive:/Physical path"
$vdPhysicalPathAuth = "VDUserPassThrough"
$vdAuthUserName = ""
$vdAuthUserPassword = ""
$appCmdCommands = ""

# Test 1 

$result = Set-IISVirtualDirectory -parentWebsiteName $parentWebsiteNameForVD -virtualPath $virtualPathForVD -physicalPath $physicalPathForVD -PhysicalPathAuth  $vdPhysicalPathAuth `
                -physicalPathAuthUserName $vdAuthUserName -physicalPathAuthUserPassword $vdAuthUserPassword -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -CreateVirtualDirectory $true -WebsiteName "Sample Web Site" -VirtualPath "/App/Vdir" -PhysicalPath "Drive:/Physical path" -PhysicalPathAuth "VDUserPassThrough" -PhysicalPathAuthUsername "" -PhysicalPathAuthUserPassword "" -AppCmdCommands ""' $result

# Test 2 

$virtualPathForVD = "App/Vdir"
Assert-Throws {
    Set-IISVirtualDirectory -parentWebsiteName $parentWebsiteNameForVD -virtualPath $virtualPathForVD -physicalPath $physicalPathForVD -PhysicalPathAuth  $vdPhysicalPathAuth `
            -physicalPathAuthUserName $vdAuthUserName -physicalPathAuthUserPassword $vdAuthUserPassword -appCmdCommands $appCmdCommands
} -MessagePattern "Virtual path should begin with a /"

# Test 3 

$virtualPathForVD = "/App/Vdir"
$vdPhysicalPathAuth = "VDWindowsAuth"
$vdAuthUserName = "name"
$vdAuthUserPassword = "pass"

$result = Set-IISVirtualDirectory -parentWebsiteName $parentWebsiteNameForVD -virtualPath $virtualPathForVD -physicalPath $physicalPathForVD -PhysicalPathAuth  $vdPhysicalPathAuth `
                -physicalPathAuthUserName $vdAuthUserName -physicalPathAuthUserPassword $vdAuthUserPassword -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -CreateVirtualDirectory $true -WebsiteName "Sample Web Site" -VirtualPath "/App/Vdir" -PhysicalPath "Drive:/Physical path" -PhysicalPathAuth "VDWindowsAuth" -PhysicalPathAuthUsername "name" -PhysicalPathAuthUserPassword "pass" -AppCmdCommands ""' $result