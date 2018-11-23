import * as Q from 'q';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as tl from 'vsts-task-lib/task';

import * as providers from 'artifact-engine/Providers';

var handlebars = require('handlebars');

const CommitTemplateBase: string = `{{#with changeSet as |changes|}}
  {{#each changes.items as |commit|}}
  {
    "Id": "{{commit.commitId}}",
    "Message": "{{commit.msg}}",
    "Author": {
      "displayName": "{{commit.author.fullName}}"
    },
    {{#caseIgnoreEqual changes.kind 'git'}}
    {{#with (lookupAction ../../actions 'remoteUrls') as |action|}}
    {{#if action.remoteUrls}}
    "DisplayUri": "{{#first action.remoteUrls}}{{/first}}/commit/{{commit.commitId}}",
    {{/if}}
    {{/with}}
    {{/caseIgnoreEqual}}
    "Timestamp": "{{commit.date}}"
  },
  {{/each}}
  {{/with}}`;

const CommitsTemplate: string = `[
  {{#each (lookup . buildParameter)}}
  {{> commit this}}
  {{/each}}
]`;

const CommitTemplate: string = `[
    ${CommitTemplateBase}
]`;

const GetCommitMessagesTemplate: string = `{{pluck . 'Message'}}`

export class CommitsDownloader {
    private webProvider: providers.WebProvider;

    constructor(webProvider: providers.WebProvider) {
        handlebars.registerPartial('commit', CommitTemplateBase);
        this.webProvider = webProvider;
    }

    public WriteContentToFileAndUploadAsAttachment(content: string, filePath: string): Q.Promise<any> {
        let defer = Q.defer<void>();

        // ensure it has .json extension
        if (path.extname(filePath) !== ".json") {
            filePath = `${filePath}.json`;
        }

        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.log(tl.loc("CouldNotWriteToFile", err));
                defer.reject(err);
                return;
            }

            console.log(tl.loc("UploadingAttachment", filePath));
            console.log(`##vso[task.uploadfile]${filePath}`);
            defer.resolve(null);
        });

        return defer.promise;
    }

    public static GetCommitMessagesFromCommits(commits: string): string[] {
        console.log(tl.loc("GetCommitMessages"));

        // remove the extra comma at the end of the commit item
        let index: number = commits.lastIndexOf(",");
        if (index > -1) {
            commits = commits.substring(0, index) + commits.substring(index + 1);
        }

        let template = handlebars.compile(GetCommitMessagesTemplate);
        try {
            var result = template(JSON.parse(commits));
        } catch(error) {
            console.log(tl.loc("GetCommitMessagesFailed", error));
            throw error;
        }

        tl.debug(`Commit messages: ${result}`);
        return result.split(',');
    }

    public DownloadFromSingleBuildAndSave(jenkinsJobDetails: any): Q.Promise<string> {
        let defer: Q.Deferred<string> = Q.defer<string>();
        
        console.log(tl.loc("GettingCommitsFromSingleBuild", jenkinsJobDetails.buildId));
        this.GetCommitsFromSingleBuild(jenkinsJobDetails).then((commits: string) => {
            this.UploadCommits(commits).then(() => {
                defer.resolve(commits);
            }, (error) => {
                defer.reject(error);
            });
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    public DownloadFromBuildRangeAndSave(jenkinsJobDetails: any, startIndex: number, endIndex: number): Q.Promise<string> {
        let defer: Q.Deferred<string> = Q.defer<string>();

        this.GetCommits(jenkinsJobDetails, startIndex, endIndex).then((commits: string) => {
            this.UploadCommits(commits).then(() => {
                defer.resolve(commits);
            }, (error) => {
                defer.reject(error);
            });
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    private GetCommitsFromSingleBuild(jenkinsJobDetails: any): Q.Promise<string> {
        let defer = Q.defer<string>();

        const commitsUrl: string = `${jenkinsJobDetails.multiBranchPipelineUrlInfix}/${jenkinsJobDetails.buildId}/api/json?tree=number,result,actions[remoteUrls],changeSet[kind,items[commitId,date,msg,author[fullName]]]`;

        // this.webProvider.webClient.DownloadJsonContent(commitsUrl, CommitTemplate, null).then((commitsResult) => {
        //     tl.debug(`Downloaded commits: ${commitsResult}`);
        //     defer.resolve(commitsResult);
        // }, (error) => {
        //     defer.reject(error);
        // });

        return defer.promise;
    }

    private GetCommits(jenkinsJobDetails: any, startIndex: number, endIndex: number): Q.Promise<string> {
        let defer = Q.defer<string>();

        const buildParameter: string = (startIndex >= 100 || endIndex >= 100) ? "allBuilds" : "builds"; // jenkins by default will return only 100 top builds. Have to use "allBuilds" if we are dealing with build which are older than 100 builds
        const commitsUrl: string = `${jenkinsJobDetails.multiBranchPipelineUrlInfix}/api/json?tree=${buildParameter}[number,result,actions[remoteUrls],changeSet[kind,items[commitId,date,msg,author[fullName]]]]{${endIndex},${startIndex}}`;

        tl.debug(`Downloading commits from startIndex ${startIndex} and endIndex ${endIndex}`);
        // this.webProvider.webClient.DownloadJsonContent(commitsUrl, CommitsTemplate, {'buildParameter': buildParameter}).then((commitsResult) => {
        //     tl.debug(`Downloaded commits: ${commitsResult}`);
        //     defer.resolve(commitsResult);
        // }, (error) => {
        //     defer.reject(error);
        // });

        return defer.promise;
    }

    private UploadCommits(commits: string): Q.Promise<void> {
        let defer: Q.Deferred<void> = Q.defer<void>();
        let commitsFilePath = path.join(os.tmpdir(), this.GetCommitsFileName());

        console.log(tl.loc("WritingCommitsTo", commitsFilePath));
        this.WriteContentToFileAndUploadAsAttachment(commits, commitsFilePath).then(() => {
            console.log(tl.loc("SuccessfullyUploadedCommitsAttachment"));
            defer.resolve(null);
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    private GetCommitsFileName(): string {
        let fileName: string = "commits.json";
        let commitfileName: string = tl.getInput("artifactDetailsFileNameSuffix", false);

        if (commitfileName) {
            fileName = `commits_${commitfileName}`;
        }

        return fileName;
    }
}