# WinRM - IIS Web App Deployment

## Overview

The WinRM - IIS Web App Deployment task is used to deploy a web application, and the underlying technology used by the task is [Web Deploy](http://www.iis.net/downloads/microsoft/web-deploy). Web Deploy packages the web application content, configuration and any other artifacts like registry, GAC assemblies etc. that can be used deployment. If the package needs to be redeployed to a different environment, configuration values within the package can be parameterized during deployment without requiring modifications to the packages themselves. Web deploy works with IIS 7, IIS 7.5, IIS 8, and IIS 8.5.

The task runs on the automation agent machine, and connects to the target machine(s) using [Windows Remote Management][1] (WinRM), and launches a bootstrapping executable program (VisualStudioRemoteDeployer.exe) on the target machine(s), and the bootstrap executable invokes the PowerShell scripts to locate the AppCmd.exe on the machine, and creates or updates the website and the application pool using the AppCmd.exe. As the execution happens within the target machine(s), it is important to have the pre-requisites described below, installed properly on the target machine(s).

## Contact Information

Please contact the alias RM\_Customer\_Queries at microsoft dot com, if you are facing problems in making this task work. Also, share feedback about the task, and the new features that you would like to see in it.

## Pre-requisites for the task

The following pre-requisites need to be setup in the target machine(s) for the task to work properly.

### IIS Web Server

There should be a IIS web server already installed and configured on the pre-existing machines or virtual machines. The task creates or updates websites and application pools, and deploys IIS web applications but does not install or configure IIS web server on the machines.

To dynamically deploy IIS on machines, use the [PowerShell on Target Machines]((https://github.com/Microsoft/vso-agent-tasks/tree/master/Tasks/PowerShellOnTargetMachines)) task and run the ConfigureWebServer.ps1 script on it from the [Fabrikamfiber GitHub Repo](https://github.com/fabrikamfiber/customerservice/tree/master/DeployTemplate). This script will also install the Web Deploy on the machines and is needed for deploying the IIS Web Apps.

### Windows Remote Management (WinRM) Setup for On-premises Physical or Virtual Machines

The IIS Web Application Deployment task uses the [Windows Remote Management](https://msdn.microsoft.com/en-us/library/aa384426.aspx) (WinRM) to access domain-joined or workgroup, on-premises physical or virtual machines. Setup the target machines as per the following, to ensure that the WinRM has been setup properly on them:

| Target Machine State     | Target Machine Trust with Automation Agent    | Machine Identity | Authentication Account | Authentication Mode | Authentication Account Permission on Target Machine | Connection Type | Pre-requisites in Target machine for Deployment Tasks to Succeed |
| --------|---------|-------|-------|-------|--------|---------|-------------|
| Domain joined machine in Corp network  | Trusted   | DNS name | Domain account | Kerberos | Machine Administrator | WinRM HTTP | <ul><li> WinRM HTTP port (default 5985) opened in Firewall.</li> <li>File & Printer sharing enabled.</li></ui>  |
| Domain joined machine in Corp network  | Trusted   | DNS name | Domain account | Kerberos | Machine Administrator | WinRM HTTPS | <ul><li> WinRM HTTPS port (default 5986) opened in Firewall.</li> <li>Trusted certificate in Automation agent</li>. <li>If Trusted certificate not in Automation agent, then Test Certificate option enabled in Task for deployment.</li> <li>File & Printer sharing enabled.</li> |
| Domain joined machine or Workgroup machine, in Corp network  | Any   | DNS name | Local machine account | NTLM | Machine Administrator | WinRM HTTP |<ul><li> WinRM HTTP port (default 5985) opened in Firewall.</li><li> Disable UAC remote restrictions [link](https://support.microsoft.com/en-us/kb/951016).</li><li> Credential in domain\\account name  or machine\\account name format.</li><li> Set "AllowUnencrypted" option and add remote machines in "Trusted Host" list in Automation Agent [link](https://msdn.microsoft.com/en-us/library/aa384372.aspx).</li><li> File & Printer sharing enabled.</li>|
| Domain joined machine or Workgroup machine, in Corp network  | Any   | DNS name | Local machine account | NTLM | Machine Administrator | WinRM HTTP | <ul><li>WinRM HTTPS port (default 5986) opened in Firewall.</li><li> Disable UAC remote restrictions [link](https://support.microsoft.com/en-us/kb/951016).</li><li> Credential in <Account> format.</li><li> Trusted certificate in Automation agent.</li><li> If Trusted certificate not in Automation agent, then Test Certificate option enabled in Task for deployment.</li><li> File & Printer sharing enabled.</li> |

### Windows Remote Management (WinRM) Setup for Azure Virtual Machines

- Azure virtual machines only work with the WinRM HTTPS protocol. When creating [classic](https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-windows-tutorial-classic-portal/) virtual machine from the new Azure portal(https://portal.azure.com/) or the classic Azure portal(https://manage.windowsazure.com/), the virtual machine is already setup for WinRM HTTPS, with the default port 5986 already open in Firewall, and a self-signed certificate installed on the machine. These virtual machines can be directly added to the WinRM - IIS Web App Management task, with the WinRM protocol selected as HTTPS, and the Test Certificate option selected. Selecting the Test Certificate option means that the certificate is a self-signed certificate, and the automation agent will skip validating the authenticity of the machine's certificate from a trusted certification authority.
- The existing [classic](https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-windows-tutorial-classic-portal/) virtual machines can be also selected using the [Azure Resource Group Deployment](https://github.com/Microsoft/vso-agent-tasks/tree/master/Tasks/DeployAzureResourceGroup) task.
- If a [resource group](https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-windows-hero-tutorial/) has been created in the Azure Portal(https://portal.azure.com/), then it needs to be setup for the WinRM HTTPS protocol. The steps listed in the section above should be used to setup the WinRM HTTPS on them.
- To dynamically deploy Azure resource groups with virtual machines in them use the [Azure Resource Group Deployment](https://github.com/Microsoft/vso-agent-tasks/tree/master/Tasks/DeployAzureResourceGroup) task. The task has a checkbox titled - **Enable Deployment Pre-requisites**. Select this option to setup the WinRM HTTPS protocol on the virtual machines, and to open the 5986 port in the Firewall, and to install the test certificate. After this the virtual machines. The virtual machines are then ready for use in the deployment task.

### Web Deploy

Web Deploy (msdeploy.exe) is used to deploy the web application on the IIS server. It is not needed for this task but for the **WinRM - IIS Web App Deployment** task. Web Deploy needs to be installed on the target machines where the IIS Server has been installed, and can be easily done so using [Microsoft Web Platform Installer](http://www.microsoft.com/web/gallery/install.aspx?appid=wdeploynosmo). Note that the link will open Web PI with the Web Deploy showing-up ready to install. The Web Deploy 3.5 needs to be installed without the bundled SQL support. There is no need to choose any custom settings while installing Web Deploy. After installing the Web Deploy is available at C:\Program Files (x86)\IIS\Microsoft Web Deploy V3. The task [PowerShell on Target Machines](https://github.com/Microsoft/vso-agent-tasks/tree/master/Tasks/PowerShellOnTargetMachines) can be used to deploy, Web Deploy, to Azure virtual machines or domain-joined/workgroup on-premises machines.

AppCmd.exe is an in-built command line tool of IIS and does not need to be separately installed. It is used to create or update websites and application pools.

### Specifying Machine Details in the Task

Specify the machine details, wiz. the IP Address or the FDQN, administrator's login, password, WimRM HTTP/HTTPS protocol, and Test Certificate in the task itself. The difference between using the domain-joined/workgroup on-premises physical or virtual machines and the Azure virtual machines is that copying files to them is done by separate tasks. The [Windows Machine File Copy](https://github.com/Microsoft/vso-agent-tasks/tree/master/Tasks/WindowsMachineFileCopy) is used for the domain-joined/workgroup machines and the [Azure File Copy](https://github.com/Microsoft/vso-agent-tasks/tree/master/Tasks/AzureFileCopy) is used for the Azure virtual machines. Note that the **WinRM - IIS Web App Deployment** task expects the web application's package zip files to be available on the target machines or on a UNC path that is accessible by the target machine administrator's login.

## Parameters of the task

The task is used to deploy a web application to an existing website in the IIS web server using web deploy. The task parameters of the different sections are described in detail below. The parameters listed with a \* are required parameters for the task.

### Machine Details
This section of the task is used to provide the details of the machines to the task so that it can open a WinRM session with them and launch the bootstrap executable.

 - **Machines\*:** Specify comma separated list of machine FQDNs/IP addresses along with port(optional). For example dbserver.fabrikam.com, dbserver_int.fabrikam.com:5986,192.168.34:5986. Output variables from preceding tasks, like Azure Resource Group Deployment task, can be also provided here, e.g. $(Fabrikam). Port when not specified will be defaulted to WinRM defaults based on the specified protocol. i.e., (For *WinRM 2.0*):  The default HTTP port is 5985, and the default HTTPS port is 5986.
 - **Admin Login\*:** Domain or Local administrator of the target host. Format: &lt;Domain or hostname&gt;\&lt; Admin User&gt;, like fabrikam\markbrown.
 - **Password\*:**  Password for the admin login. It can accept variable defined in Build/Release definitions as '$(passwordVariable)'. The variable type should be marked as 'secret' to secure it.
 - **Protocol\*:**  Specify the protocol that will be used to connect to target host, either HTTP or HTTPS.
 - **Test Certificate:** Select the option to skip validating the authenticity of the machine's certificate by a trusted certification authority. The parameter is required for the WinRM HTTPS protocol.

### Deploy IIS Web Application
This section of the task is used to deploy the web application to an existing IIS website and uses Web Deploy to do so.

- **Web Deploy Package\*:** Location of the web deploy zip package file on the target machine or on a UNC path that is accessible to the administrator credentials of the machine like, \\\\BudgetIT\Web\Deploy\FabrikamWeb.zip. Environment variables are also supported like $env:windir, $env:systemroot etc. For example, $env:windir\FabrikamFibre\Web.
- **Web Deploy Parameters File:** The parameter file is used to override the default settings in the web deploy zip package file like, the IIS Web application name or the database connection string. This helps in having a single package that can be deployed across dev, test, staging, and production, with a specific parameter file for each environment. The parameter takes in the location of the parameter file on the target machines or on a UNC path.
- **Override Parameters:** Parameters specified here will override the parameters in the MSDeploy zip file and the Parameter file. The format followed here is same as that for [setParam](https://technet.microsoft.com/en-us/library/dd569084.aspx) option of MsDeploy.exe. For example, name="IIS Web Application Name",value="Fabrikam/MyApplication"
- **Website Name\*:** The name of the IIS website where the Web App will be deployed. The name of the website should be same as that specified in the web deploy zip package file. If a Parameter file and override Parameters setting is also specified, then the name of the website should be same as that in the override Parameters setting.

### Advanced
The section provides for advanced options.
  - **Deploy in Parallel:**  Selecting the option, will run the IIS Web App Deployment task, in-parallel on the target machines.

## Known Issues
  - The IIS Web Application Deployment task does not provide support for Web Deploy manifest files and has not been tested and verified for ASP.NET Core 1 web applications. Send us feedback for the task and for the support for manifest files, ASP.NET Core 1/MVC 6 we applications at RM\_Customer\_Queries at microsoft dot com.

  [1]: https://msdn.microsoft.com/en-us/library/aa384426(v=vs.85).aspx
