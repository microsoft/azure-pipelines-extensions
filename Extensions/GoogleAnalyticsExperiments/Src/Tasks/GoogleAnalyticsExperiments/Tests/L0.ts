import assert = require('assert');
import path = require('path');
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('L0 for google analytics extension', function () {

    before( function() {

    });

    after(() => {

    });

    it('should succeed with no json file', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'update_without_file.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert(tr.stdout.search(`ExperimentWithIdUpdatedSuccessfully`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");

        done();
    });

    it('should succeed with overlapping json file', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'update_with_overlapping_file.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert(tr.stdout.search(`ExperimentWithIdUpdatedSuccessfully`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");

        done();
    });

    it('should fail with json file not found', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'update_with_file_not_available.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have succeeded');
        assert(tr.stdout.search(`FileNotFound`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have no errors");

        done();
    });

    it('should succeed with non-overlapping json file', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'update_with_non_overlapping_file.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert(tr.stdout.search(`ExperimentWithIdUpdatedSuccessfully`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");

        done();
    });

    it('should fail with Id mismatch in json file', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'update_with_id_mismatch_file.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have succeeded');
        assert(tr.stdout.search(`IdMismatch`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have 1 errors");

        done();
    });

    it('should fail with JSON parsing error', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'update_with_incorrect_file.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`FailedToParseFile`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");

        done();
    });

    it('should succeed with no Traffic Coverage ', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'update_without_trafficCoverage.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`TotalTrafficValueNotValid`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.errorIssues.length, 1, "should have no error issue");


        done();
    });

    it('should fail with incorrect Traffic Coverage input', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'incorrect_traffic_coverage.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`TotalTrafficValueNotValid`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");

        done();
    });

    it('should fail with "not a number" Traffic Coverage input', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'update_with_NAN_trafficCoverage.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`TotalTrafficValueNotValid`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");

        done();
    });

    it('should fail with incorrect access token', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'incorrect_access_token.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`AccessTokenGenerationFailed`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");

        done();
    });

    it('should fail with status code 401', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'status_code_401.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`FailedToFetchCurrentExperiment`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues, 0, "should have no warnings");

        done();
    });

    it('should fail with incomplete mandatory inputs', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'incomplete_input.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`FailedToFetchInputs`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");

        done();
    });

    it('should fail when trying to stop an already ENDED experiment', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'ended_experiment_stop.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        console.log(tr.stdout);
        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`StopFailed`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues, 0, "should have no warnings");

        done();
    });

    it('should fail when trying to update an already ENDED experiment', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'ended_experiment_update.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`UpdateFailed`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues, 0, "should have no warnings");

        done();
    });

    it('should fail with invalid action', function(done: MochaDone) {
        this.timeout(1000);

        let tp = path.join(__dirname,'invalid_action.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.succeeded);
        assert.equal(tr.succeeded, false, 'should have failed');
        assert(tr.stdout.search(`InvalidAction`) > 0, 'Should not be able to update the experiment');
        assert.equal(tr.warningIssues, 0, "should have no warnings");

        done();
    });

});
