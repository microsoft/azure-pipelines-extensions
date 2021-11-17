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
- [Terraform](https://aka.ms/AAese2w)


## Contact Information

This extension is authored by [Microsoft DevLabs](https://marketplace.visualstudio.com/publishers/Microsoft%20DevLabs). It is not supported by Microsoft.

To report a problem with this extension, create an issue in this repository. The maintainers of this repository will review and respond to the issue.

You can also report problems or share feedback about this extension on [Developer Community Forum](https://developercommunity.visualstudio.com/spaces/21/index.html).
