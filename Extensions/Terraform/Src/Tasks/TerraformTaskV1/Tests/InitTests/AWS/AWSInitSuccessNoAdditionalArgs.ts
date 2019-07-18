import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './AWSInitSuccessNoAdditionalArgsL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'aws');
tr.setInput('command', 'init');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('commandOptions', '');

tr.setInput('backendServiceAWS', 'AWS');
tr.setInput('backendAWSBucketName', 'DummyBucket');
tr.setInput('backendAWSKey', 'DummyKey');

process.env['ENDPOINT_AUTH_SCHEME_AWS'] = 'Basic';
process.env['ENDPOINT_AUTH_PARAMETER_AWS_USERNAME'] = 'DummyUsername';
process.env['ENDPOINT_AUTH_PARAMETER_AWS_PASSWORD'] = 'DummyPassword';
process.env['ENDPOINT_AUTH_PARAMETER_AWS_REGION'] = 'DummyRegion';

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "terraform": "terraform"
    },
    "checkPath": {
        "terraform": true
    },
    "exec": {
        "terraform init -backend-config=bucket=DummyBucket -backend-config=key=DummyKey -backend-config=region=DummyRegion -backend-config=access_key=DummyUsername -backend-config=secret_key=DummyPassword": {
            "code": 0,
            "stdout": "Executed Successfully"
        }
    }
}

tr.setAnswers(a);

tr.run();