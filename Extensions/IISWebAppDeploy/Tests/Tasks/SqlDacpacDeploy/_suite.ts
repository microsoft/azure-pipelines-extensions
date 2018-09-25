import Q = require('q');
import assert = require('assert');
const fs = require('fs');
var path = require('path');
var psm = require('../../../../Common/lib/psRunner');
var shell = require('shelljs');
var ps = shell.which('powershell.exe');
var psr = null;

describe('SqlDacpacDeploy Suite', function () {
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
        it('should test EscapeSpecialChars functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0EscapeSpecialCharsFunction.ps1'), done);
        });

        it('should test TrimInputs functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0TrimInputsFunction.ps1'), done);
        });

        it('should test RunRemoteDeployment functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0RunRemoteDeploymentFunction.ps1'), done);
        });

        it('should test GetScriptToRun functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0GetScriptToRunFunction.ps1'), done);
        });

        it('should test Main functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0MainFunction.ps1'), done);
        });

        it('should test RunCommand functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0RunCommandFunction.ps1'), done);
        });

        it('should test Get-SqlPackageOnTargetMachine functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0GetSqlPackageOnTargetMachineFunction.ps1'), done);
        });

        it('should test Get-SqlPackageForSqlVersion functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0GetSqlPackageForSqlVersionFunction.ps1'), done);
        });

        // it('should test LocateHighestVersionSqlPackageWithSql functionality', (done:MochaDone) => {
        //     psr.run(path.join(__dirname, 'L0LocateHighestVersionSqlPackageWithSqlFunction.ps1'), done);
        // });

        it('should test LocateHighestVersionSqlPackageWithDacMsi functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0LocateHighestVersionSqlPackageWithDacMsiFunction.ps1'), done);
        });

        it('should test LocateSqlPackageInVS functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0LocateSqlPackageInVSFunction.ps1'), done);
        });

        // it('should test LocateHighestVersionSqlPackageInVS functionality', (done:MochaDone) => {
        //     psr.run(path.join(__dirname, 'L0LocateHighestVersionSqlPackageInVSFunction.ps1'), done);
        // });

        it('should test Get-SqlPackageCmdArgs functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0GetSqlPackageCmdArgsFunction.ps1'), done);
        });

        it('should test Invoke-DacpacDeployment functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0InvokeDacpacDeploymentFunction.ps1'), done);
        });

        it('should test Import-SqlPs functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0ImportSqlPs.ps1'), done);
        });

        it('should test Invoke-SqlQueryDeployment functionality', (done:MochaDone) => {
            psr.run(path.join(__dirname, 'L0InvokeSqlQueryDeploymentFunction.ps1'), done);
        });
    }
});
