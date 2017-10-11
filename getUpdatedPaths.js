"use strict";
var https = require('https'); 
class GitClient {
    constructor(repository) {
        this.repository = repository;
    }
    getUpdatedFilePathsForPR(prNumber) {
        var promise = new Promise((resolve, reject) => {
            var url = "api.github.com";
            var endpoint = "/repos/" + this.repository + "/pulls/" + prNumber + "/files";
            var options = {
                host: url,
                port: 443,
                path: endpoint,
                method: 'GET',
                headers: { 'User-Agent': 'rm-cdp', 'Accept': 'application/json' }
            };
            var req = https.request(options, function (res) {
                res.setEncoding('utf-8');
                var responseString = '';
                res.on('data', function (data) {
                    responseString += data;
                });
                res.on('end', function () {
                    var changes = JSON.parse(responseString);
                    var paths = changes.map(x => x.filename);
                    var updatedPaths = paths.join(',');
                    resolve(updatedPaths);
                });
            });
            req.end();
            req.on('error', function (e) {
                console.error(e);
            });
        });
        return promise;
    }
}
exports.GitClient = GitClient;
var currentPullRequest = process.env['BUILD_SOURCEBRANCH'];
console.log(currentPullRequest);
var prNumber = currentPullRequest.split('/')[2];
console.log(prNumber);
var repository = process.env['BUILD_REPOSITORY_NAME'];
console.log(repository);
new GitClient(repository).getUpdatedFilePathsForPR(prNumber).then((updatedPaths) => {
    console.log(`##vso[task.setvariable variable=updatedpaths;]${updatedPaths}`);
}).catch((error) => {
    console.log(error);
});