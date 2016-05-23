# **IIS Web App Deployment Using WinRM**

Using Windows Remote Management (WinRM), connect to the host machine(s) where IIS is installed, and manage the Web application as described below:

 - Create a new website or update an existing website.
 - Create a new application pool or update an existing application pool.
 - Deploy a Web Application to the IIS Server using Web Deploy.

To easily **setup WinRM** on the **host machines** follow the directions for [domain-joined machines](https://www.visualstudio.com/en-us/docs/release/examples/other-servers/net-to-vm) or the [workgroup machines](https://www.visualstudio.com/en-us/docs/release/examples/other-servers/net-to-workgroup-vm).

The SQL Server Database Deployment task will be added to the extension in the next update.

VSTS accounts that are using the **preview tasks** wiz. **IIS Web Application Deployment** or **SQL Server Database Deployment**, should move to this extension. All **future enhancements** to the IIS Web App Deployment task or to the SQL Server Database Deployment task will be provided in this extension.

## **Usage**

The extension installs the following tasks:

  ![IIS Web App Deployment Using WinRM](Images/IISWebDeploymentTasks.png)

- **WinRM: IIS Web App Management**: Create or update IIS websites and app pools. The task's detailed documentation is in the [source repo](http://aka.ms/IISMgmt).

  ![WinRM: IIS Web App Management](Images/IISWebManagement.png)

- **WinRM: IIS Web App Deployment**: Deploy an IIS Web App using Web Deploy. The task's detailed documentation is in the [source repo](http://aka.ms/IISWebDeploy).

  ![WinRM: IIS Web App Deployment](Images/IISWebDeployment.png)

### **Contact Information**

For further information or to resolve issues, contact RM_Customer_Queries at Microsoft dot com.

### **Change Log**

For detailed information on changes in new release refer [change log](https://github.com/Microsoft/vsts-rm-extensions/blob/master/Extensions/IISWebAppDeploy/Src/CHANGELOG.md)
