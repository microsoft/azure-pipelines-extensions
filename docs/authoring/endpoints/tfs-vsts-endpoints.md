# TFS/VSTS endpoints for Datasource Bindings
## Overview
Data source bindings essentially bind a drop-down input field in UI (e.g. task input) which needs to be dynamically populated with values with the corresponding REST API that needs to be invoked to fetch the list of values.

In case of REST APIs supported by external VSTS services (e.g. Azure, TeamCity, BitBucket etc.), data source binding takes the endpoint Id that needs to be used to query the values & details of REST API.

For e.g. AzureRmWebAppDeployment task defines data source binding referring to the above data source:
```
{
  "target": "SlotName",
  "endpointId": "$(ConnectedServiceName)",
  "dataSourceName": "AzureRMWebAppSlotsId",
  "parameters": {
    "WebAppName": "$(WebAppName)",
    "ResourceGroupName": "$(ResourceGroupName)"
  },
  "resultTemplate": "{\"Value\":\"{{{ #extractResource slots}}}\",\"DisplayValue\":\"{{{ #extractResource slots}}}\"}"
}
```
The following blog describes the different fields of the data source binding:
https://blogs.msdn.microsoft.com/sriramb/2016/09/15/service-endpoints-data-sources/

However, there are scenarios where inputs would need to be populated with values obtained from VSTS REST APIs. For e.g. getting a list of VSTS Build Definitions, VSTS feeds/packages etc.

These queries do not require an endpoint to be created and specified in the data source binding.

In order to support such queries, data source bindings support taking endpointId in the format:

tfs:{service}

For e.g. DownloadPackage task defines the following dataSourceBinding:
```
{
"target": "feed",
"endpointId": "tfs:feed",
"endpointUrl": "{{endpoint.url}}/_apis/packaging/feeds",
"resultSelector": "jsonpath:$.value[*]",
"resultTemplate": "{ \"Value\" : \"{{{id}}}\", \"DisplayValue\" : \"{{{name}}}\" }"
},
```
## Supported VSTS Services
Below are the set of VSTS services we currently support within dataSourceBindings:
```
tfs:teamfoundation – Any micro service hosted within TFS (e.g. Build, Test etc.)
tfs:packaging – Packaging service
tfs:feed – Feed service
tfs:rm – Release Management service
tfs:ems - Extension Management service
```
Note that data source bindings using these services will work seamlessly in TFS as well as VSTS.

Support for tfs:packaging & tfs:feed is added with TFS 2018 Release.

Support for tfs:rm & tfs:governance is added with TFS 2018 Update 2 Release.

Support for tfs:ems is added with TFS 2019 Release.

VSTS REST APIs are documented here: https://docs.microsoft.com/en-us/rest/api/vsts/