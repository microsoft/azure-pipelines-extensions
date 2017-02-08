# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Fixed
- Fixing if physical path is UNC trimming issue.

## [1.4.3] - 31st January 2017
### Fixed
- Fixing issue for variable as additional arguments
- Fixing convertTo/From-Json cmdlet not found for PSVersion 2.0

## [1.4.2] - 4th January 2017
### Fixed
- Assign SSL certificate to HTTPS binding when passing IP and port
- Special character issues in sql task inputs

## [1.4.1] - 8th December 2016
### Fixed
- Fixing override parameters not honored issue

## [1.4.0] - 7th December 2016
### Added
- Support for deploying Asp.Net4, Asp.Net Core 1 and Node Apps using
    - Build output in the form of folder or UNC Path
    - Compressed (zip) build output

## [1.3.0] - 1st December 2016
### Added
- Added support for Sql Server, Dac Framwork 2016

### Fixed
- Error messages are not showing on console for SQL task

## [1.2.4] - 12th October 2016
### Fixed
- Deployment fails when user name has a dot
- No proper error message is displaced when msdeploy not installed
- Fixed enable SNI failure when website name has spaces

## [1.2.3] - 2nd September 2016
### Fixed
- Web App Management fails with: Given binding already exists for a different website.
- Web App deployment fails when physical path for website ends with back slash.

## [1.2.2] - 9th August 2016
### Fixed
- Web App Deploy task fails when there is a spacial character like $ in msdeploy.exe additional arguments.
- SQL Dacpac Deploy task fails when there is a spacial character in server name or Database name.
- SQL Dacpac Deploy task always work with Windows Authentication even Auth Scheme is selected as SQL Server Authentication.

## [1.2.1] - 27th June 2016
### Fixed
- Web App Deploy task fails when there is a space in website name.
- Web App Deploy task fails when appoffline is selected and the website folder does not exist.

## [1.2.0] - 24th June 2016
### Added
- Support for taking application offline
- Support for excluding files from App_Data
- Support for retaining extra files in target deployment folder
- Additional arguments support for verb:sync 

## [1.1.0] - 15th June 2016
### Added
- Sql Server Dacpac deployment task.

### Fixed
- No managed code option not working for application clr version

## [1.0.2] - 1st June 2016
### Fixed
- Fixed checking for binding even when add binding is false

## [1.0.1] - 25th May 2016
### Fixed
- Fixed tasks not accepting duplicate machine names with different port

## [1.0.0] - 20th May 2016
### Fixed
- Fixed help markdown issue for override params of IIS Web Deployment task.
- Fixed handling special characters ('$', '`') in password for IIS Web Management task.

## [0.2.0] - 11th May 2016
### Fixed
- Fixed index out of bounds issue in deployment sdk.

## [0.1.0] - 10th May 2016
### Added
- IIS web application deployment task.
- IIS web application management task.

