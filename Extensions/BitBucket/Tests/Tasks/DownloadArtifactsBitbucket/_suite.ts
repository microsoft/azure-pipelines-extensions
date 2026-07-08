import assert = require('assert');
import path = require('path');

var mocktest = require('azure-pipelines-task-lib/mock-test');

// Path to task.json for MockTestRunner to determine Node version
const taskJsonPath = path.join(__dirname, '../../../Src/Tasks/DownloadArtifactsBitbucket/task.json');

describe('DownloadArtifactsBitbucket Suite', function () {
    before(() => {
    });
    after(() => {
    });

    it('should download with token authentication', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testTokenAuthentication');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('Using token authentication'), 'should use token auth');
            assert(runner.stdOutContained('git clone called'), 'should call git clone');
            assert(runner.stdOutContained('git checkout called'), 'should call git checkout');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should download with username/password authentication', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testUsernamePasswordAuthentication');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('hostUsername:'), 'should use username/password auth');
            assert(runner.stdOutContained('git clone called'), 'should call git clone');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should handle refs/heads/ branch prefix correctly', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testRefsHeadsBranchPrefix');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('refs/remotes/origin/main'), 'should convert refs/heads/ to refs/remotes/origin/');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should handle simple branch name without prefix', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testSimpleBranchName');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('git checkout called: main'), 'should use branch name directly');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should fail gracefully when repository not found', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testRepositoryNotFound');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.failed, "Should have failed");
            assert(runner.stdOutContained('Repository not found') || runner.errorIssues.length > 0, 'should report repository not found error');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should fail gracefully when using unsupported auth scheme', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testUnsupportedAuthScheme');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.failed, "Should have failed");
            assert(runner.stdOutContained('not supported') || runner.errorIssues.some((issue: string) => issue.includes('not supported')), 
                'should report unsupported auth scheme error');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should clean download path before cloning', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testCleanDownloadPath');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('shell.rm -rf'), 'should clean download path');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should use correct API endpoint version (v2.0)', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testApiVersion');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('/2.0/repositories/'), 'should use API v2.0');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should mask credentials in logs', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testCredentialMasking');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            // Verify setSecret was called to mask the token (the mock-task doesn't actually mask output)
            assert(runner.stdOutContained('##vso[task.setsecret]'), 'should call setSecret to mask credentials');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should checkout specific commit after branch checkout', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testCommitCheckout');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('git checkout called: abc123def456'), 'should checkout specific commit');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should use x-bitbucket-api-token-auth username for token auth', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testTokenAuthUsername');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.succeeded, "Should have succeeded");
            assert(runner.stdOutContained('x-bitbucket-api-token-auth'), 'should use special token auth username');
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should handle clone failure gracefully', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testCloneFailure');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.failed, "Should have failed");
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });

    it('should handle checkout failure gracefully', async function () {
        this.timeout(30000);
        let testPath = path.join(__dirname, 'testCheckoutFailure');
        let runner = new mocktest.MockTestRunner(testPath, taskJsonPath);
        await runner.runAsync();

        try {
            assert(runner.failed, "Should have failed");
        }
        catch (error) {
            console.log("STDERR", runner.stderr);
            console.log("STDOUT", runner.stdout);
            throw error;
        }
    });
});
