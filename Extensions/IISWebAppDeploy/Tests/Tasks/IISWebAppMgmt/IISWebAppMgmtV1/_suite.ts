import Q = require('q');
import assert = require('assert');
var path = require('path');
var psm = require('../../../../../Common/lib/psRunner');
var shell = require('shelljs');
var ps = shell.which('powershell.exe');
var psr = null;

describe('IISWebAppMgmtV1 Suite', function () {
    this.timeout(parseInt(process.env.TASK_TEST_TIMEOUT) || 20000);

    before((done) => {
        if (ps) {
            psr = new psm.PSRunner();
            psr.start();
        }

        done();
    });

    after(function () {
        psr.kill();
    });

    if (ps) {
        it('test iis manage utility - Get-HostName function', (done) => {
            psr.run(path.join(__dirname, 'L0GetHostNameFunction.ps1'), done);
        })

        it('test iis manage utility - Trim-Inputs function', (done) => {
            psr.run(path.join(__dirname, 'L0TrimInputsFunction.ps1'), done);
        })

        it('test iis manage utility - Escape-SepcialChars function', (done) => {
            psr.run(path.join(__dirname, 'L0EscapeSpecialCharsFunction.ps1'), done);
        })

        it('test iis manage utility - Validate-Inputs function', (done) => {
            psr.run(path.join(__dirname, 'L0ValidateInputsFunction.ps1'), done);
        })

        it('test iis manage utility - Get-ScriptToRun function', (done) => {
            psr.run(path.join(__dirname, 'L0GetScriptToRunFunction.ps1'), done);
        })

        it('test iis manage utility - Run-RemoteDeployment function', (done) => {
            psr.run(path.join(__dirname, 'L0RunRemoteDeploymentFunction.ps1'), done);
        })

        it('test iis manage utility - Main function', (done) => {
            psr.run(path.join(__dirname, 'L0MainFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Run-Command function', (done) => {
            psr.run(path.join(__dirname, 'L0RunCommandFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Get-AppCmdLocation function', (done) => {
            psr.run(path.join(__dirname, 'L0GetAppCmdLocationFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Does-WebsiteExists function', (done) => {
            psr.run(path.join(__dirname, 'L0DoesWebsiteExistsFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Does-BindingExists function', (done) => {
            psr.run(path.join(__dirname, 'L0DoesBindingExistsFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Does-AppPoolExists function', (done) => {
            psr.run(path.join(__dirname, 'L0DoesAppPoolExistsFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Enable-SNI function', (done) => {
            psr.run(path.join(__dirname, 'L0EnableSniFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Add-SslCert function', (done) => {
            psr.run(path.join(__dirname, 'L0AddSslCertFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Create-Website function', (done) => {
            psr.run(path.join(__dirname, 'L0CreateWebsiteFunction.ps1'), done);
        })
        
        it('test AppCmdOnTargetMachines - Create-AppPool function', (done) => {
            psr.run(path.join(__dirname, 'L0CreateAppPoolFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Run-AdditionalCommands function', (done) => {
            psr.run(path.join(__dirname, 'L0RunAdditionalCommandsFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Update-WebSite function', (done) => {
            psr.run(path.join(__dirname, 'L0UpdateWebSiteFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Update-AppPool function', (done) => {
            psr.run(path.join(__dirname, 'L0UpdateAppPoolFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Create-And-Update-WebSite function', (done) => {
            psr.run(path.join(__dirname, 'L0CreateAndUpdateWebSiteFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Create-And-Update-AppPool function', (done) => {
            psr.run(path.join(__dirname, 'L0CreateAndUpdateAppPoolFunction.ps1'), done);
        })

        it('test AppCmdOnTargetMachines - Execute-Main function', (done) => {
            psr.run(path.join(__dirname, 'L0ExecuteMainFunction.ps1'), done);
        })
    }    
});