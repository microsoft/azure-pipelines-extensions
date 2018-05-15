# DataSources and DataSourceBindings

## Overview

Service endpoints support querying data from external services through REST API. The data queried can be used to populate task input dropdowns.

## DataSource
Endpoint type can define `datasources` which are essentially external service’s REST API references.

For e.g. *Azure RM* endpoint type defines the following data source :
```
"dataSources": [
    {
        "name": "AzureRMWebAppSlotsId",
        "endpointUrl": "https://management.azure.com/subscriptions/$(endpoint.subscriptionId)/resourceGroups/$(ResourceGroupName)/providers/Microsoft.Web/sites/$(WebAppName)/slots?api-version=2015-08-01",
        "resultSelector": "jsonpath:$.value[*].id"
    }
]
```

URL for the data source can include `endpoint.*` variables. These correspond to the inputs in the endpoint data. For e.g. `subscriptionId` is an additional input defined in the *Azure RM* endpoint type :

```
"inputDescriptors": [
    {
        "id": "subscriptionId",
        "name": "i18n:Subscription Id",
        "description": "i18n:Subscription Id from the <a href=\"https://go.microsoft.com/fwlink/?LinkID=312990\" target=\"_blank\">publish settings file</a>",
        "inputMode": "textbox",
        "isConfidential": false,
        "validation": {
            "isRequired": true,
            "dataType": "guid",
            "maxLength": 38
        }
    }
]
```
 
In addition to the endpoint inputs, `endpoint.Url` is also available as a variable.

URL can also include variables that correspond to other task inputs. Variable value resolves to the value of the corresponding task input. For e.g. `ResourceGroupName` is an input defined in the *AzureRMWebAppDeployment* task:

```
{
    "name": "ResourceGroupName",
    "type": "pickList",
    "label": "Resource Group",
    "defaultValue": "",
    "required": true,
    "properties": {
        "EditableOptions": "True"
    },
    "helpMarkDown": "Enter or Select the Azure Resource Group that contains the AzureRM Web App specified above.",
    "visibleRule": "DeployToSlotFlag = true"
}
```

In addition to defining the URL for the data source, a `resultSelector` can also be defined. In the example above, result selector is a JSON PATH query which gets applied on each of the elements in the the REST API response data.

Result selector can also be an XPATH query. For e.g. *Azure Classic* endpoint type supports data sources that use XPATH query.

```
{
    "name": "AzureWebSiteNames",
    "endpointUrl": "$(endpoint.url)/$(endpoint.subscriptionId)/services/webspaces/$(WebSiteLocation)Webspace/sites",
    "resultSelector": "xpath://Site/Name"
}
```
 
## Data source bindings

In order to refer to data sources defined by endpoint type in tasks, data source bindings are used. For e.g. *AzureRmWebAppDeployment* task defines data source binding referring to the above data source :

```
"dataSourceBindings": [
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
]
```

A dataSourceBinding has the following fields :
- [Target](#target)
- [EndpointId](#endpointId)
- [DataSourceName](#dataSourceName)
- [Parameters](#parameters)
- [ResultTemplate](#resultTemplate)

<a name="target"></a>
`target` indicates the task input that this data source binding will bind to. For e.g. *AzureRmWebAppDeployment* task takes the following task input that corresponds to the slot name drop down :

```
"inputs": [
    {
        "name": "SlotName",
        "type": "pickList",
        "label": "Slot",
        "defaultValue": "",
        "required": true,
        "properties": {
            "EditableOptions": "True"
        },
        "helpMarkDown": "Enter or Select an existing Slot other than the Production slot.",
        "visibleRule": "DeployToSlotFlag = true"
    }
]
```
 
<a name="endpointId"></a>
`endpointId` contains the service endpoint ID to be used in the data source binding. It typically corresponds to the service endpoint task input defined in the task. For e.g. this is the input that corresponds to the service endpoint in case of *AzureRmWebAppDeployment* task :

```
"inputs": [
    {
        "name": "ConnectedServiceName",
        "type": "connectedService:AzureRM",
        "label": "AzureRM Subscription",
        "defaultValue": "",
        "required": true,
        "helpMarkDown": "Select the Azure Resource Manager subscription for the deployment."
    }
]
```

** Here the task defines endpoint input of type `AzureRM`.

If endpoint type supports multiple authentication schemes, we can even scope down the endpoint selection to specific authentication schemes. For e.g. this is the input that corresponds to the service endpoint in case of *AzureRmWebAppDeployment* task:

```
"inputs": [
    {
        "name": "ConnectedServiceName",
        "type": "connectedService:Azure:Certificate,UsernamePassword",
        "label": "Azure Subscription (Classic)",
        "defaultValue": "",
        "required": true,
        "helpMarkDown": "Azure Classic subscription to target for deployment."
    }
]
```

<a name="dataSourceName"></a>
`dataSourceName` in the data source binding corresponds to the data source in the endpoint type. In case the endpoint type does not define data source that the task is interested in, then there is provision to define the details of data source inline as part of the data source binding.

Here is how the data source corresponding to *AzureRMWebAppSlotsId* looks like:

```
"dataSources": [
    {
        "name": "AzureRMWebAppSlotsId",
        "endpointUrl": "https://management.azure.com/subscriptions/$(endpoint.subscriptionId)/resourceGroups/$(ResourceGroupName)/providers/Microsoft.Web/sites/$(WebAppName)/slots?api-version=2015-08-01",
        "resultSelector": "jsonpath:$.value[*].id"
    }
]
```

<a name="parameters"></a>
`parameters` represent the key/value pairs used when resolving the data source URL. In addition to `endpoint.*` variables, there could be variables used in the URL that correspond to the other task inputs. The name/value for these variables are provided by the parameters field in the data source binding.

For e.g. `WebAppName` & `ResourceGroupName` parameters correspond to the task inputs for *AzureRmWebAppDeployment* task:

```
"inputs": [
    {
        "name": "WebAppName",
        "type": "pickList",
        "label": "Web App Name",
        "defaultValue": "",
        "required": true,
        "properties": {
            "EditableOptions": "True"
        },
        "helpMarkDown": "Enter or Select the name of an existing AzureRM Web Application."
    },
    {
        "name": "ResourceGroupName",
        "type": "pickList",
        "label": "Resource Group",
        "defaultValue": "",
        "required": true,
        "properties": {
            "EditableOptions": "True"
        },
        "helpMarkDown": "Enter or Select the Azure Resource Group that contains the AzureRM Web App specified above.",
        "visibleRule": "DeployToSlotFlag = true"
    }
]
```

<a name="resultTemplate"></a>
`resultTemplate` defines a template that represents how the data has to be transformed before returning back. The template essentially is a Mustache template & can include Mustache handlers natively supported.

Here’s sample response from `AzureRMWebAppSlotsId` data source:

```
{
    "value": [
        {
            "id": "/subscriptions/c94bda7a-0577-4374-9c53-0e46a9fb0f70/resourceGroups/webapprgpt/providers/Microsoft.Web/sites/nodewebapp123/slots/Slot1",
            "name": "nodewebapp123/Slot1",
            "type": "Microsoft.Web/sites/slots",
            "location": "South Central US",
            "tags": null,
            "properties": {}
        },
        {
            "id": "/subscriptions/c94bda7a-0577-4374-9c53-0e46a9fb0f70/resourceGroups/webapprgpt/providers/Microsoft.Web/sites/nodewebapp123/slots/Slot2",
            "name": "nodewebapp123/Slot2",
            "type": "Microsoft.Web/sites/slots",
            "location": "South Central US",
            "tags": null,
            "properties": {}
        }
    ],
    "nextLink": null,
    "id": null
}
```

Here’s the result after applying the data source binding corresponding to `SlotName` :

```
{
    "count": 2,
    "value": [
        "{\"Value\":\"Slot1\",\"DisplayValue\":\"Slot1\"}",
        "{\"Value\":\"Slot2\",\"DisplayValue\":\"Slot2\"}"
    ]
}
```

## Test service endpoint

To avoid creating or updating a service endpoint with incorrect values for the inputs, we support a “Test” action in UI. Upon choosing to “Test” an endpoint, we internally invoke query on a data source with a specific name – `TestConnection`. For e.g. *Azure RM* endpoint type defines the following `TestConnection` data source:

```
"dataSources": [
    {
        "name": "TestConnection",
        "endpointUrl": "https://management.azure.com/subscriptions/$(endpoint.subscriptionId)/providers/Microsoft.Web/sites?api-version=2015-08-01",
        "resultSelector": "jsonpath:$.value[*].name"
    }
]
```

If this data source isn’t present in the endpoint type, then testing the connection isn’t supported.

`resultSelector` in TestConnection is optional and is not used to determine if the test succeeded or failed. When testing the connection using this datasource, we only check for the HTTP status code of the underlying REST API call. If HTTP `status.code == OK` then the test will succeed.