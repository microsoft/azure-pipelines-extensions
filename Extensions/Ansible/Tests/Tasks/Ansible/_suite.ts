import assert = require('assert');
import path = require('path');

var mocktest = require('vsts-task-lib/mock-test');

describe('Ansible Suite', function () {
    before(() => {
    });
    after(() => {
    });

    it('should run with playbook and inventory on agent machine for remote machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testPlaybookAndInventoryOnAgentMachineForRemoteMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('copied file to remote machine = /path/to/ansiblePlaybookRoot'), 'should able to copy playbook to remote machine');
            assert(runner.stdOutContained('copied file to remote machine = /path/to/ansibleInventory'), 'should able to copy inventory file to remote machine');
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i /tmp/ansibleInventory /tmp/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should able to run playbook on remote machine');
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

    it('should run with playbook and inventory on ansible machine for remote machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testPlaybookAndInventoryOnAnsibleMachineForRemoteMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i /path/to/ansibleInventory /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should able to run playbook on remote machine');
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

    it('should run when inventory is the host list for remote machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testInventoryToBeHostListForRemoteMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should able to run playbook on remote machine');
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

    // it('should run when inventory is inline content for remote machine', (done: MochaDone) => {
    //     this.timeout(1000);
    //     let testPath = path.join(__dirname, 'testInventoryToBeInlineForRemoteMachine');
    //     let runner = new mocktest.MockTestRunner(testPath);
    //     runner.run();

    //     try {
    //         assert(runner.succeeded, "Should have succeeded");
    //         assert(runner.stdOutContained('cmd run on remote machine = echo "DUMMY_IP_ADDRESS" > /tmp/inventory.ini'), 'should able to copy the inline content to inventory.ini file on remote machine');
    //         assert(runner.stdOutContained('cmd run on remote machine = chmod +x /tmp/inventory.ini'), 'should able to make the inventory.ini file as executable for dynamic inventory');
    //         assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i /tmp/inventory.ini /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should able to run playbook on remote machine');
    //         assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
    //         assert(runner.stdOutContained('connection to dummy client terminated'), 'should able disconnect to client');
    //         assert(runner.stdOutContained('cmd run on remote machine = rm -f /tmp/inventory.ini', 'should clean all the temporary inventory file on remote machine'));
    //         done();
    //     }
    //     catch (error) {
    //         console.log("STDERR", runner.stderr);
    //         console.log("STDOUT", runner.stdout);
    //         done(error);
    //     }
    // });

    it('should run when sudo and additional parameters is present for remote machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testSudoUserAndAdditionalParamsProvidedForRemoteMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on remote machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml -b --become-user root --extra-variables "pass=123"'), 'should able to run playbook on remote machine');
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

    it('should run with playbook and inventory on agent machine for agent machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testPlaybookAndInventoryOnAgentMachineForAgentMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on agent machine = ansible-playbook -i /path/to/ansibleInventory ansiblePlaybook.yml'), 'should able to run playbook on agent machine');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    it('should run when inventory is the host list for agent machine', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'testInventoryToBeHostListForAgentMachine');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('cmd run on agent machine = ansible-playbook -i "Dummy_IP_Address," /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should able to run playbook on remote machine');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });

    // it('should run when inventory is inline content for agent machine', (done: MochaDone) => {
    //     this.timeout(1000);
    //     let testPath = path.join(__dirname, 'testInventoryToBeInlineForAgentMachine');
    //     let runner = new mocktest.MockTestRunner(testPath);
    //     runner.run();

    //     try {
    //         assert(runner.succeeded, "Should have succeeded");
    //         assert(runner.stdOutContained('cmd run on agent machine = echo "DUMMY_IP_ADDRESS" > /tmp/inventory.ini'), 'should able to copy the inline content to inventory.ini file on remote machine');
    //         assert(runner.stdOutContained('cmd run on agent machine = chmod +x /tmp/inventory.ini'), 'should able to make the inventory.ini file as executable for dynamic inventory');
    //         assert(runner.stdOutContained('cmd run on agent machine = ansible-playbook -i /tmp/inventory.ini /path/to/ansiblePlaybookRoot/ansiblePlaybook.yml'), 'should able to run playbook on remote machine');
    //         assert(runner.stdOutContained('cmd run on agent machine = rm -f /tmp/inventory.ini', 'should clean all the temporary inventory file on remote machine'));
    //         done();
    //     }
    //     catch (error) {
    //         console.log("STDERR", runner.stderr);
    //         console.log("STDOUT", runner.stdout);
    //         done(error);
    //     }
    // });
});