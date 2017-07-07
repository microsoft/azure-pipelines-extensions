import assert = require('assert');
import path = require('path');

var mocktest = require('vsts-task-lib/mock-test');

describe('Ansible Suite', function() {
    before(()=>{
        console.log("before");
    });
    after(()=>{
        console.log("after");
    });

    it('should run playbook via CLI', (done: MochaDone)=>{
        console.log("test");
        this.timeout(20000);
        let testPath = path.join(__dirname, 'executeViaSSH.js');
        let runner = new mocktest.MockTestRunner(testPath);
        runner.run();

        try
        {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('connection to dummy client established'), 'should able connect to client');
            assert(runner.stdOutContained('connection to dummy client terminated'), 'should terminate connection to client');
            assert(runner.stdOutContained('Dummy logs'), 'should print logs');
            done();
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            done(error);
        }
    });
});