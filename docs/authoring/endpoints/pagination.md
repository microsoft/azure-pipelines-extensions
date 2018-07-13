# Pagination
The support of pagination in data sources is given by following template:
```
{
     "endpointUrl": “someUrl”
     "callbackContextTemplate": ""
     "callbackRequiredTemplate": "boolean"
     "initialContextTemplate": ""
}
```

Important fields explained:
- `endpointUrl` : Standard context here. The url that you intend to call.
- `callbackContextTemplate` : This is the set of parameters that we will need to call this API again. Generally, this will be derived from the response of the previous call. It's supposed to be a set of key-value pairs.
- `callbackRequiredTemplate` : This is basically a boolean flag which identifies whether further call to API is needed. It does so based on the response of the previous call. Calling back to the API is the responsibility of the client. In case of VsTest task sampled below, we are doing it from task editor UI.
- `initialContextTemplate` : This is the set of parameters needed for the first call. It is also a set of key-value pairs.

Depending on the kind of pagination supported by the underlying API, the logic to determine the value of "callbackRequiredTemplate" can be anything. 
We expect both "callbackContextTemplate" and "callbackRequiredTemplate" to be provided as mustache templates. Examples follow:

### Sample Data Source
```
{
    "endpointUrl": "{{endpoint.url}}/{{project}}/_apis/****/****?&$top=500&continuationToken={{{continuationToken}}}",
    "callbackContextTemplate": "{\"continuationToken\" : \"{{{headers.x-ms-continuationtoken}}}\"}",
    "callbackRequiredTemplate": "{{{#headers.x-ms-continuationtoken}}}true{{{/headers.x-ms-continuationtoken}}}",
    "initialContextTemplate":"{\"continuationToken\" : \"{{{system.utcNow}}}\"}"
}
```
Usually, 2 major pagination patterns are used:
- `ContinutationToken`: https://blog.philipphauer.de/web-api-pagination-continuation-token/
- `Skip/Top`: http://sharepoint/sites/AzureUX/Sparta/_layouts/15/WopiFrame2.aspx?sourcedoc=%7b3E014CE9-835D-410A-8807-6743E8201039%7d&file=Azure%20REST%20Design%20Guidelines%20v2.1.docx&action=default&DefaultItemOpen=1

### Sample Data Source explained
- `EndpointUrl` : It defines 2 query params, $top and continuationToken, which are needed for pagination in this particular API. Notice that continuationToken is given as a mustache.
- `callbackContextTemplate` : It's again a mustache. It's just a json where the key is continuationToken and {{{headers.x-ms-continuationtoken}}} will be resolved as it's value.
- `callbackRequiredTemplate` : This mustache tells that if key  "headers.x-ms-continuationtoken" is present, resolve it and evaluate to true otherwise evaluate to false.
- `initialContextTemplate` : Since the endpointURL contains a variable(continuationToken), it needs some initial value for the very first call. That is provided using this template. In this case, it's a dictionary with just one key. "system.utcNow" is a first class variable. It is resolved as the current time stamp in the format "yyyy'-'MM'-'dd'T'HH':'mm':'ss.fffffff'Z'"

Note: The author needs to take care of the page size. It should be chosen such that the response of one call does not exceed 2MB. If the response structure changes at some time in future, that needs to be taken care of here also.
So, keep a buffer to not run into this limitation.

An example can be seen with the VsTest task's data source binding that targets the test plans:
https://github.com/Microsoft/vsts-tasks/blob/master/Tasks/VsTestV2/task.json

### Throttling
Since task owners have been given the liberty to decide the page size and it may result in inefficient behavior if the page size is kept too small, we want to enforce a hard limit on the number of calls we will make to the service. For now, we have decided it to be 5. We will change it, if needed, in future.
