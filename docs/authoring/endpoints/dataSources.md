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

In addition to defining the URL for the data source, a `resultSelector` can also be defined. The result selector specifies how to extract data from the REST API response.

### resultSelector Reference

The `resultSelector` field must be prefixed with one of the following supported types:

| Prefix | Description | Implementation |
|--------|-------------|----------------|
| `jsonpath:` | JSONPath query for JSON responses | [Newtonsoft.Json](https://www.newtonsoft.com/json) (`JToken.SelectTokens`) |
| `xpath:` | XPath query for XML responses | .NET `System.Xml.XPath` (`XDocument.XPathSelectElements`) |
| `none` | No selection; returns empty result | - |
| `plaintext` | Returns raw response body as plain text | - |

#### JSONPath (`jsonpath:`)

JSONPath expressions are evaluated using the **Newtonsoft.Json** (Json.NET) library's [`JToken.SelectTokens()`](https://www.newtonsoft.com/json/help/html/SelectToken.htm) method. The supported syntax follows the [Json.NET JSONPath documentation](https://www.newtonsoft.com/json/help/html/QueryJsonSelectToken.htm).

> **Important:** Not all JSONPath features from other implementations (e.g., Jayway JsonPath for Java, Stefan Goessner's original spec) are supported. Always refer to the Newtonsoft.Json documentation for exact supported syntax.

**Supported operators:**

| Operator | Description | Example |
|----------|-------------|---------|
| `$` | Root object | `jsonpath:$` |
| `.property` | Child property | `jsonpath:$.store.book` |
| `..property` | Recursive descent (deep scan) | `jsonpath:$..name` |
| `[*]` | Array wildcard (all elements) | `jsonpath:$.value[*].id` |
| `[n]` | Array index (zero-based) | `jsonpath:$.value[0]` |
| `[n,m]` | Array union (multiple indices) | `jsonpath:$.value[0,1]` |
| `[start:end]` | Array slice | `jsonpath:$.value[0:3]` |
| `[?()]` | Filter expression | `jsonpath:$.value[?(@.properties.isEnabled == true)]` |

**Examples:**

```json
// Select all IDs from a "value" array
"resultSelector": "jsonpath:$.value[*].id"

// Select all names using recursive descent
"resultSelector": "jsonpath:$..name"

// Filter items based on a nested property value
"resultSelector": "jsonpath:$.value[?(@.properties.isEnabled == true)]"

// Select the root object itself
"resultSelector": "jsonpath:$"
```

**Known limitations:**

The following JSONPath features, available in some other libraries, are **not supported** by Newtonsoft.Json's JPath engine:

| Unsupported Feature | Description |
|---------------------|-------------|
| `~` (tilde) | Property name selector. Returns property keys instead of values. Available in libraries like `jsonpath-plus`, but not in Newtonsoft.Json. |
| `$..['key1','key2']` | Multi-property recursive descent may behave differently than in other JSONPath implementations. |

> **Common pitfall — extracting property names from JSON objects:**
> Some Azure DevOps REST APIs return data as key-value dictionaries rather than arrays. For example, the Variable Groups API returns variables as:
> ```json
> { "variables": { "MyVar1": { "value": "hello" }, "MyVar2": { "value": "world" } } }
> ```
> There is currently no supported `resultSelector` expression to extract just the property names (`MyVar1`, `MyVar2`). The `~` operator that some JSONPath libraries support for this purpose is not available in the Newtonsoft.Json implementation used here. In such cases, users must type values manually or use a `resultTemplate` to work with the property values instead of the keys.

#### XPath (`xpath:`)

XPath expressions are evaluated using .NET's [`XDocument.XPathSelectElements()`](https://learn.microsoft.com/en-us/dotnet/api/system.xml.xpath.extensions.xpathselectelements) method, which supports standard **XPath 1.0** syntax.

> **Important:** Default XML namespaces are automatically stripped from the response before evaluation. You do **not** need to handle default namespace prefixes in your XPath expressions.

**Examples:**

```json
// Select Name elements under Site
"resultSelector": "xpath://Site/Name"

// Union of multiple element types
"resultSelector": "xpath://Blobs/Blob | //Blobs/BlobPrefix"
```

#### Other selector types

- **`none`** - Returns an empty result. Useful when no data extraction is needed (e.g., for write-only REST calls).
- **`plaintext`** - Returns the raw HTTP response body as a single plain-text string.

### Response size limits

The response body is subject to a maximum size limit. If the REST API response exceeds this limit, an error is thrown. Ensure that your API calls include appropriate pagination or filtering parameters to keep response sizes under **2 MB**.
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

**Note**: In case your response is an arrary of strings like `['value1','value2']` you can use template like `"{ Value : "{{defaultResultKey}}", DisplayValue : "{{defaultResultKey}}" }"`.`defaultResultKey` will take on values `value1`, `value2` e.t.c

## Test service endpoint

To avoid creating or updating a service endpoint with incorrect values for the inputs, we support a “Test” action in service endpoint UI. Upon choosing to “Test” an endpoint, we internally invoke query on a data source with a specific name – `TestConnection`. For e.g. *Azure RM* endpoint type defines the following `TestConnection` data source:

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


## Defining URL inline within dataSourceBinding

Datasources are defined within service endpoint type contribution. DataSourceBindings that refer to dataSources are defined in various tasks for e.g. In case a task needs to call into a REST API that is supported by the endpoint type but there is no dataSource defined for that REST API in the endpoint type contribution, then it is possible to define the URL to invoke inline within the dataSourceBinding.

For e.g. below is a dataSourceBinding for querying alert rules defined in Microsoft.Insights resource provider in Azure.

```
"dataSourceBindings": [
	{
		"target": "alertRules",
		"endpointId": "$(connectedServiceNameARM)",
		"endpointUrl": "{{{endpoint.url}}}subscriptions/{{{endpoint.subscriptionId}}}/resourcegroups/$(ResourceGroupName)/providers/microsoft.insights/alertrules?api-version=2016-03-01&$filter=targetResourceUri eq /subscriptions/{{{endpoint.subscriptionId}}}/resourceGroups/$(ResourceGroupName)/providers/$(ResourceType)/$(resourceName)",
		"resultSelector": "jsonpath:$.value[?(@.properties.isEnabled == true)]",
		"resultTemplate": "{ \"Value\" : \"{{{name}}}\", \"DisplayValue\":\"{{{name}}}\"}"
	}
]
```
