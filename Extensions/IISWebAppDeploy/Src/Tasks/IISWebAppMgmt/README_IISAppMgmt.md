# WinRM - IIS Web App Management

## Overview

The WinRM - IIS Web App Management task is used to create or update websites and application pools, and the underlying technology used by the task is [AppCmd.exe](http://www.iis.net/learn/get-started/getting-started-with-iis/getting-started-with-appcmdexe). AppCmd.exe is the single command line tool for managing IIS 7 and above. It exposes all key server management functionality through a set of intuitive management objects that can be manipulated from the command line or from scripts.

The task runs on the automation agent machine, and connects to the target machine(s) using [Windows Remote Management][1] (WinRM), and launches a bootstrapping executable program (VisualStudioRemoteDeployer.exe) on the target machine(s), and the bootstrap executable invokes the PowerShell scripts to locate the AppCmd.exe on the machine, and creates or updates the website and the application pool using the AppCmd.exe. As the execution happens within the target machine(s), it is important to have the pre-requisites described below, installed properly on the target machine(s).

## Contact Information

Please contact the alias RM\_Customer\_Queries at microsoft dot com, if you are facing problems in making this task work. Also, share feedback about the task, and the new features that you would like to see in it.

## Pre-requisites for the task

The following pre-requisites need to be setup in the target machine(s) for the task to work properly.

### IIS Web Server

There should be a IIS web server already installed and configured on the pre-existing machines or virtual machines. The task creates or updates websites and application pools, and deploys IIS web applications but does not install or configure IIS web server on the machines.

To dynamically deploy IIS on machines, use the [PowerShell on Target Machines]((https://github.com/Microsoft/vso-agent-tasks/tree/master/Tasks/PowerShellOnTargetMachines)) task and run the ConfigureWebServer.ps1 script on it from the [Fabrikamfiber GitHub Repo](https://github.com/fabrikamfiber/customerservice/tree/master/DeployTemplate). This script will also install the Web Deploy on the machines and is needed for deploying the IIS Web Apps.

### Windows Remote Management (WinRM) Setup for On-premises Physical or Virtual Machines

The IIS Web Application Deployment task uses the [Windows Remote Management](https://msdn.microsoft.com/en-us/library/aa384426.aspx) (WinRM) to access domain-joined or workgroup, on-premises physical or virtual machines. 

To easily **setup WinRM** on the **host machines** follow the directions for [domain-joined machines](https://www.visualstudio.com/en-us/docs/release/examples/other-servers/net-to-vm) or the [workgroup machines](https://www.visualstudio.com/en-us/docs/release/examples/other-servers/net-to-workgroup-vm).

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

The task is used for creating new IIS website and application pools, or to update existing ones. The task has two sections and the parameters of the different sections are described in detail below. The parameters listed with a **\*** are required parameters for the task.

The task first creates/updates the application pool, and then creates/updates the websites, and then applies the additional App.Cmd.exe commands, The additional AppCmd.exe sections are optional and if none of them are provided, then the task directly deploys the web application to the IIS website.

### Machine Details
This section of the task is used to provide the details of the machines to the task so that it can open a WinRM session with them and launch the bootstrap executable.

 - **Machines\*:** Specify comma separated list of machine FQDNs/IP addresses along with port(optional). For example dbserver.fabrikam.com, dbserver_int.fabrikam.com:5986,192.168.34:5986. Output variables from preceding tasks, like Azure Resource Group Deployment task, can be also provided here, e.g. $(Fabrikam). Port when not specified will be defaulted to WinRM defaults based on the specified protocol. i.e., (For *WinRM 2.0*):  The default HTTP port is 5985, and the default HTTPS port is 5986.
 - **Admin Login\*:** Domain or Local administrator of the target host. Format: &lt;Domain or hostname&gt;\&lt; Admin User&gt;, like fabrikam\markbrown.
 - **Password\*:**  Password for the admin login. It can accept variable defined in Build/Release definitions as '$(passwordVariable)'. The variable type should be marked as 'secret' to secure it.
 - **Protocol\*:**  Specify the protocol that will be used to connect to target host, either HTTP or HTTPS.
 - **Test Certificate:** Select the option to skip validating the authenticity of the machine's certificate by a trusted certification authority. The parameter is required for the WinRM HTTPS protocol.

### Website
The section of the task is used to create a new IIS website or to update an existing one by using the IIS Server's AppCmd.exe command line tool. For more information about the parameters see the [websites](https://technet.microsoft.com/library/hh831681.aspx#Add_Site) page on MSDN.
  - **Create or Update Website**: Select the option to create a new website or to update an existing one.
  - **Website Name\*:** The name of the IIS website that will be created if it does not exist, or it will be updated if it is already present on the IIS server. The name of the website should be same as that specified in the web deploy zip package file. If a Parameter file and override Parameters setting is also specified, then the name of the website should be same as that in the override Parameters setting.
  - **Physical Path\*:** Physical path where the website content is stored. The content can reside on the local computer or on a remote directory or share like, C:\Fabrikam or \\ContentShare\Fabrikam
  - **Physical Path Authentication\*:** Specify credentials to connect to the physical path. If credentials are not provided, the web server uses pass-through authentication. This means that content the is accessed by using the application user's identity, and configuration files are accessed by using the application pool's identity. By default, Application user (pass-through authentication) is selected.
  - **Username:** If Windows authentication is selected in the physical path authentication, then provide the username for accessing the physical path.
  - **Password:** Password of the user to access the physical path.
  - **Add Binding:** Select the option to add bindings for the website.
  - **Assign Duplicate Binding:** Selecting this option will add the bindings specified here, even if there is another website with the same bindings. If there are binding conflicts, then only one of the website will start.
  - **Protocol:** Select HTTP for the website to have an HTTP binding, or select HTTPS for the website to have a Secure Sockets Layer (SSL) binding.
  - **IP Address\*:** Type an IP address that users can use to access this website. If All Unassigned is selected, the site will respond to requests for all IP addresses on the port and the optional host name that is specified for this site, unless there is another site on the server that has a binding on the same port but with a specific IP address. For example, the default website binding specifies All Unassigned for IP address, and 80 for Port, and no host name. If the server has a second site named Fabrikam with a binding that specifies 172.30.189.132 for IP address on port 80 and no host name, Contoso receives all HTTP requests to port 80 on IP address 172.30.189.132, and the default website continues to receive HTTP requests to port 80 on any IP address other than 172.30.189.132.
  - **Port\*:** Type the port on which Hypertext Transfer Protocol Stack (HTTP.sys) must listen for requests made to this website. The default port for HTTP is 80 and for HTTPS it is 443. If any other port is specified, apart from the default ports, clients must specify the port number in requests to the server or they will not be able to connect to the website.
  - **Host Name:** To assign one or more host names (aka domain names) to a computer that uses a single IP address, type a host name here. If a host name is specified, then the clients must use the host name instead of the IP address to access the website.
  - **Server Name Indication Required:** Determines whether the website requires Server Name Indication (SNI). SNI extends the SSL and TLS protocols to indicate what host name the client is attempting to connect to. It allows multiple secure websites with different certificates to use the same IP address. The checkbox is displayed when the binding type is HTTPS. This parameter only works with IIS 8 and later versions of IIS. If SNI is selected, then host name should be also specified
  - **SSL Certificate Thumbprint:** Thumbprint of the Secure Socket Layer certificate that the website is going to use. The certificate should be already installed on the machine and present under the Local Computer, Personal store.

### Application Pool
The section is used to create a new IIS application pool or to update an existing one by using the IIS Server's AppCmd.exe command line tool. For more information about the parameters see the [application pools](https://technet.microsoft.com/library/hh831797.aspx) page on MSDN.

  - **Create or Update Website:** Select the option to create a new website or to update an existing one.
  - **Name\*:** The name of the IIS application pool that will be created if it does not exist, or it will be updated if it is already present on the IIS server. The name of the application pool should be same as that specified in the web deploy zip package file. If a Parameter file and override Parameters setting is also specified, then the name of the application pool should be same as that in the override Parameters setting.
  - **.NET Version\*:** Version of the .NET Framework that is loaded by this application pool. If the applications assigned to this application pool do not contain managed code, select the No Managed Code option from the list.
  - **Managed Pipeline Mode\*:** Managed pipeline mode specifies how IIS processes requests for managed content. Use classic mode only when the applications in the application pool cannot run in the Integrated mode.
  - **Identity\*:** Configure the account under which an application pool's worker process runs. Select one of the predefined security accounts or configure a custom account. If custom account is selected then username and password of the custom account should be also provided.
  - **Username:** If custom account is selected in Identity, then provide the username for accessing the physical path.
  - **Password:** Password of the custom account.

### Advanced
The section provides for advanced options.

  - **Additional AppCmd.exe Commands:** Additional [AppCmd.exe](https://technet.microsoft.com/en-us/library/cc732107.aspx) commands to set website or application pool properties. For more than one command use line separator. For example:

      ```c
      set config /section:applicationPools /[name='Fabrikam'].autoStart:false
      add site /name:fabrikam /bindings:http/\*:85: fabrikam.com.
      ```
  - **Deploy in Parallel:** Selecting the option, will run the IIS Web App Management task, in-parallel on the target machines.

## Known Issues
  - The IIS Web Application Deployment task does not provide support for Web Deploy manifest files and has not been tested and verified for ASP.NET Core 1 web applications. Send us feedback for the task and for the support for manifest files, ASP.NET Core 1/MVC 6 we applications at RM\_Customer\_Queries at microsoft dot com.

  [1]: https://msdn.microsoft.com/en-us/library/aa384426(v=vs.85).aspx
