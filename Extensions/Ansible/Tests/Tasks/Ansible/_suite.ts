import assert = require('assert');
import path = require('path');

var mocktest = require('vsts-task-lib/mock-test');

describe('Ansible Suite', function () {
    before(() => {
    });
    after(() => {
    });

    it('should run with playbook and inventory on agent machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testPlaybookAndInventoryOnAgentMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('copied file to remote machine = /path/to/ansiblePlaybookRoot'), 'should able to copy playbook to remote machine');
            assert(runner.stdOutContained('copied file to remote machine = /path/to/ansibleInventory'), 'should able to copy inventory file to remote machine');
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook /tmp/ansiblePlaybookRoot/ansiblePlaybook.yml -i /tmp/ansibleInventory'), 'should able to run playbook on remote machine');
            assert(runner.stdOutContained('cmd run on remote machine = rm -rf /tmp/ansiblePlaybookRoot'), 'should clean all the temporary playbook file copied to remote machine');
            assert(runner.stdOutContained('cmd run on remote machine = rm -f /tmp/ansibleInventory', 'should clean all the temporary inventory file copied to remote machine'));
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should able disconnect to client');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    it('should run with playbook and inventory on ansible machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testPlaybookAndInventoryOnAnsibleMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -i /path/to/ansibleInventory'), 'should able to run playbook on remote machine');
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should able disconnect to client');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    it('should run when inventory is the host list', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testInventoryToBeHostList');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -i Dummy_IP_Address'), 'should able to run playbook on remote machine');
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should able disconnect to client');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    it('should run when inventory is inline content', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testInventoryToBeInline');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = echo "DUMMY_IP_ADDRESS" > /tmp/inventory.ini'), 'should able to copy the inline content to inventory.ini file on remote machine');
            assert(runner.stdOutContained('cmd run on remote machine = chmod +x /tmp/inventory.ini'), 'should able to make the inventory.ini file as executable for dynamic inventory');
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -i /tmp/inventory.ini'), 'should able to run playbook on remote machine');
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should able disconnect to client');
            assert(runner.stdOutContained('cmd run on remote machine = rm -f /tmp/inventory.ini', 'should clean all the temporary inventory file on remote machine'));
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    it('should run when sudo user and additional params are provided', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testInventoryToBeInline');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = echo "DUMMY_IP_ADDRESS" > /tmp/inventory.ini'), 'should able to copy the inline content to inventory.ini file on remote machine');
            assert(runner.stdOutContained('cmd run on remote machine = chmod +x /tmp/inventory.ini'), 'should able to make the inventory.ini file as executable for dynamic inventory');
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -i /tmp/inventory.ini'), 'should able to run playbook on remote machine');
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should able disconnect to client');
            assert(runner.stdOutContained('cmd run on remote machine = rm -f /tmp/inventory.ini', 'should clean all the temporary inventory file on remote machine'));
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    it('should run when sudo and additional parameters is present', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testSudoUserAndAdditionalParamsProvided');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -i Dummy_IP_Address -b --become-user root --extra-variables "pass=123"'), 'should able to run playbook on remote machine');
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should able disconnect to client');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    it('should run playbook via ansible tower', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testTower.js');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.stdOutContained('Dummy stdout 1'), 'should output log 1');
            assert(runner.stdOutContained('Dummy stdout 2'), 'should output log 2');
            assert(runner.stdOutContained('Dummy stdout 3'), 'should output log 3');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });
});