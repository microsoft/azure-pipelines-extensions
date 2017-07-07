import assert = require('assert');
import path = require('path');

var mocktest = require('vsts-task-lib/mock-test');

describe('Ansible Suite', function () {
    before(() => {
    });
    after(() => {
    });

    it('should run playbook via CLI', (done: MochaDone) => {
        this.timeout(1000);
        let testPath = path.join(__dirname, 'executeViaSSH.js');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should terminate connection to client');
            assert(runner.stdOutContained('Dummy Logs'), 'should print logs');
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
        let testPath = path.join(__dirname, 'executeViaTower.js');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try {
            assert(runner.succeeded, "Should have succeeded");
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