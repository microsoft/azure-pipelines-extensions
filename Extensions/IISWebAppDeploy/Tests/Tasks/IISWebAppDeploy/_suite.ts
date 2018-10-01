import Q = require('q');
import assert = require('assert');
var path = require('path');
var psm = require('../../../../Common/lib/psRunner');
var shell = require('shelljs');
var ps = shell.which('powershell.exe');
var psr = null;

describe('IISWebAppDeployment Suite', function () {
    this.timeout(20000);

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
        it('should test Trim-Inputs functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0TrimInputsFunction.ps1'), done);
        });

        it('should test EscapeSpecialCharacters functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0EscapeSpecialCharactersFunction.ps1'), done);
        });

        it('should test Get-ScriptToRun functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0GetScriptToRunFunction.ps1'), done);
        });

        it('should test Run-RemoteDeployment functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0RunRemoteDeploymentFunction.ps1'), done);
        });

        it('should test Main functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0MainFunction.ps1'), done);
        });

        it('should test Run-Command functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0RunCommandFunction.ps1'), done);
        });

        it('should test Get-MsDeployLocation functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0GetMsDeployLocationFunction.ps1'), done);
        });

        it('should test Get-MsDeployCmdArgs functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0GetMsDeployCmdArgsFunction.ps1'), done);
        });

        it('should test Contains-ParamFileXml functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0ContainsParamFileXmlFunction.ps1'), done);
        });

        it('should test Deploy-WebSite functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0DeployWebSiteFunction.ps1'), done);
        });

        it('should test Is-Directory functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0IsDirectoryFunction.ps1'), done);
        });

        it('should test Compute-MsDeploy-SetParams functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0ComputeMsDeploySetParamsFunction.ps1'), done);
        });

        it('should test Execute-Main functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0ExecuteMainFunction.ps1'), done);
        });
    }
});
