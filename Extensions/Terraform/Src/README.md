# Terraform Extension for Azure DevOps

## Overview:

This repo contains the Azure DevOps Pipeline tasks for installing Terraform and running Terraform commands in a build or release pipeline. The goal of this extension is to guide the user in the process of using Terraform to deploy infrastructure within Azure, Amazon Web Services(AWS) and Google Cloud Platform(GCP).

This extension contains the following contributions:
- Terraform tool installer - for installing Terraform if not installed on the build agent
- Terraform - for executing the core Terraform commands
- Amazon Web Services(AWS) service connection - for creating a service connection for AWS to provide AWS credentials
- Google Cloud Platform(GCP) service connection - for creating a service connection for GCP to provide GCP credentials

The tasks are capable of running on the following build agent operating systems: 
- Windows
- MacOS
- Linux

For more detailed information about the tasks, see the README for each from the below links:

- [Terraform tool installer](https://aka.ms/AA5jd97)
- [Terraform](https://aka.ms/AA5j5pf)


## Contact Information

Please report a problem at [Developer Community Forum](https://developercommunity.visualstudio.com/spaces/21/index.html) if you are facing problems in making this extension work.  You can also share feedback about the extension like, what more functionality should be added to the extension, what other tasks you would like to have, at the same place.