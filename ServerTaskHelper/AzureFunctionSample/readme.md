﻿### Sample to create Azure DevOps Pipeline agent using Azure function

You need to provide following inputs in Azure function task body

```
   { 
   "AzureSubscriptionClientId": "x7de5365-0305-1a2d-531f-2e44a1f9ec37",
   "AzureSubscriptionClientSecret": "secret",
   "TenantId": "abf9xubf-8aaf1-4134-12ab-2d7cd011db4x",
   "ResourceGroupName" : "testaci",
   "PipelineAccountName": "testaccount",
   "AgentName":  "my-test-agent",
   "AgentPoolName": "MyTestPool",
   "PATToken": "abcedf4y22xamjqb1112315pgf22o4pq21ma3a"  // This PAT token used to configure the agent. This PAT token should have permission to configure the agent.
   }
```