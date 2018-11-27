# ServiceNow Change Management Extension

ServiceNow is a software-as-a-service (SaaS) provider of IT service management (ITSM) software, including change management.
Specific change management subprocesses include change risk assessment, change scheduling, change approvals and oversight. 
With change management, your organization can reduce the risks associated with change, while speeding up the deployments with Azure pipelines. 

This extension enables integration of ServiceNow change management with Azure pipelines.
It includes a release gate to create a change request in ServiceNow and hold the pipeline till for the change management process to signal implementation.
An agentless task to close (update state of) the change request after the deployment is also provided.

The deployment process in Azure pipelines helps in automation of the deployment and complement the controls offered by ServiceNow.

## Prerequisites
- ServiceNow instance should have Azure DevOps Pipelines application installed.
- ServiceNow user created with role defined by the Azure DevOps Pipelines application. Using this user credentials, you can create service connection to ServiceNow instance from Azure DevOps.

## Installing the extension adds the following:
- **ServiceNow change management deployment gate** : To create and query for change request.
- **Agentless task**: To update change request state.
- **Service endpoint**: To connect to ServiceNow instance. 

## Input parameters for Gate:

Input provided during the creation of change request will be saved in change request record present at ServiceNow instance.
- **Short description**: A summary of the change.
- **Description**: A detailed description of the change.
- **Category**:  The category of the change, for example, Hardware, Network, Software.
- **Priority**: priority of the change.
- **Risk**: The risk level for the change.
- **Impact**: The effect that the change has on business.
- **Configuration Item**: Configuration item (CI) that the change applies to.
- **Assignment group**:  The group that the change is assigned to.
- **Schedule of change request**: Schedule of the change. Date and time should be in UTC and format should be yyyy-MM-ddTHH:mm:ssZ. eg. 2018-01-31T07:56:59Z.
- **Additional change request parameters**:  Additional properties of the change request to set. Name must be field name in ServiceNow. This may not be the same as the display label of the field. Value must be a valid, accepted value in ServiceNow. Invalid entries are ignored.

## Gate Success Criteria :
Desired state: Task would succeed when the change request status is same as the provided value.

## Input parameters for Update change request task:

- **Change request number**: Number of the change request that you want to update.
- **Updated status of change request** : Status of the change request that you want to update. Task would succeed when the change request status is same as the provided value.
- **Additional change request parameters**:  Additional properties of the change request to set.


